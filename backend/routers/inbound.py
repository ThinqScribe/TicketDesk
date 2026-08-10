"""
Resend inbound email webhook.

How it works:
  1. A customer emails support+<tenant-slug>@<INBOUND_EMAIL_DOMAIN>
     e.g. support+acme-co@mail.ticketdesk.dev
  2. Resend parses the email and POSTs JSON to POST /webhooks/inbound-email
  3. We extract the tenant slug from the recipient address, look up the tenant,
     find-or-create the customer, and open a ticket automatically.
  4. The customer gets a confirmation email with their ticket reference.

Resend inbound payload reference:
  https://resend.com/docs/dashboard/emails/inbound-emails

Security:
  Resend signs inbound webhook payloads with a shared secret you configure in
  your Resend dashboard (Webhooks → Inbound → Signing secret).
  We verify the svix-signature header before processing.
"""

import hashlib
import hmac
import logging
import re
from email.utils import parseaddr

from fastapi import APIRouter, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from core.config import settings
from core.email import send_ticket_confirmation_email
from db.database import SessionLocal
from models.customer import Customer
from models.tenant import Tenant
from models.ticket import Ticket

router = APIRouter(prefix="/webhooks", tags=["webhooks"])
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_slug_from_recipient(recipient: str) -> str | None:
    """
    Pull the tenant slug out of an address like:
      support+acme-co@mail.ticketdesk.dev  →  'acme-co'
      support@acme-co.mail.ticketdesk.dev  →  None  (not supported yet)
    Returns None if the address doesn't match the expected pattern.
    """
    _, addr = parseaddr(recipient)
    local = addr.split("@")[0] if "@" in addr else ""
    if "+" in local:
        return local.split("+", 1)[1].strip() or None
    return None


def _verify_signature(raw_body: bytes, svix_id: str, svix_ts: str, svix_sig: str) -> bool:
    """
    Verify the Resend/Svix webhook signature.
    Signed message format: "{svix_id}.{svix_ts}.{raw_body_str}"
    """
    if not settings.RESEND_INBOUND_SECRET:
        # Secret not configured — skip verification (dev only)
        logger.warning("RESEND_INBOUND_SECRET not set — skipping signature verification")
        return True

    signed_content = f"{svix_id}.{svix_ts}.{raw_body.decode('utf-8', errors='replace')}"
    secret_bytes = settings.RESEND_INBOUND_SECRET.encode()

    # Resend uses the raw secret (not base64-decoded) for HMAC-SHA256
    expected = hmac.new(secret_bytes, signed_content.encode(), hashlib.sha256).hexdigest()

    # svix_sig can be a comma-separated list of "v1,<hex>"
    for part in svix_sig.split(" "):
        if "," in part:
            _, sig_hex = part.split(",", 1)
            if hmac.compare_digest(expected, sig_hex.strip()):
                return True
    return False


def _clean_body(text: str | None) -> str:
    """Strip excessive whitespace and quoted reply chains from plain-text bodies."""
    if not text:
        return ""
    # Drop everything after a "-- " separator or quoted reply marker
    text = re.split(r"\n-- \n|\nOn .+ wrote:", text, maxsplit=1)[0]
    return text.strip()


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.post("/inbound-email", status_code=status.HTTP_204_NO_CONTENT)
async def inbound_email(
    request: Request,
    svix_id: str = Header(default=""),
    svix_timestamp: str = Header(default=""),
    svix_signature: str = Header(default=""),
):
    """
    Receive a parsed inbound email from Resend and auto-create a support ticket.
    """
    raw_body = await request.body()

    # --- Signature verification ---
    if not _verify_signature(raw_body, svix_id, svix_timestamp, svix_signature):
        logger.warning("Inbound email webhook: invalid signature — rejected")
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    logger.info(f"Inbound email received: {payload.get('subject', '(no subject)')}")

    # --- Parse Resend inbound payload ---
    # Resend wraps inbound data under a "data" key
    data = payload.get("data", payload)

    from_addr: str = data.get("from", "")
    to_list: list = data.get("to", [])
    subject: str = (data.get("subject") or "(No subject)").strip()
    text_body: str = _clean_body(data.get("text") or data.get("html") or "")

    # Parse sender name + email
    sender_name, sender_email = parseaddr(from_addr)
    sender_email = sender_email.lower().strip()
    sender_name = sender_name.strip() or sender_email

    if not sender_email:
        logger.warning("Inbound email: missing sender — ignored")
        return

    # --- Identify tenant from recipient address ---
    tenant_slug: str | None = None
    for recipient in (to_list if isinstance(to_list, list) else [to_list]):
        tenant_slug = _extract_slug_from_recipient(str(recipient))
        if tenant_slug:
            break

    if not tenant_slug:
        logger.warning(f"Inbound email: could not extract tenant slug from recipients {to_list} — ignored")
        return

    db: Session = SessionLocal()
    try:
        # --- Look up tenant ---
        tenant = db.query(Tenant).filter(Tenant.slug == tenant_slug).first()
        if not tenant:
            logger.warning(f"Inbound email: tenant slug '{tenant_slug}' not found — ignored")
            return

        # --- Find or create customer ---
        customer = db.query(Customer).filter(
            Customer.tenant_id == tenant.id,
            Customer.email == sender_email,
        ).first()

        if not customer:
            customer = Customer(
                tenant_id=tenant.id,
                name=sender_name,
                email=sender_email,
            )
            db.add(customer)
            db.flush()
            logger.info(f"Created new customer '{sender_email}' for tenant '{tenant_slug}'")

        # --- Create ticket ---
        ticket = Ticket(
            tenant_id=tenant.id,
            customer_id=customer.id,
            subject=subject[:255],
            description=text_body or subject,
            status="open",
            priority="normal",
        )
        db.add(ticket)
        db.commit()
        db.refresh(ticket)

        logger.info(f"Auto-created ticket #{ticket.id} for customer '{sender_email}' (tenant '{tenant_slug}')")

        # --- Confirmation email to customer ---
        try:
            send_ticket_confirmation_email(
                to_email=customer.email,
                customer_name=customer.name,
                ticket_id=ticket.id,
                subject=ticket.subject,
                company_name=tenant.company_name,
            )
        except Exception as e:
            logger.error(f"Failed to send confirmation email: {e}")

    except Exception as e:
        db.rollback()
        logger.error(f"Inbound email processing error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal error processing inbound email")
    finally:
        db.close()
