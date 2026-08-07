from datetime import datetime, timezone

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from core.config import settings
from core.dependencies import get_current_user, require_role
from db.database import get_db
from models.subscription import Subscription
from models.tenant import Tenant
from models.user import User, UserRole
from schemas.subscription import CheckoutSessionResponse, SubscriptionRead

stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter(tags=["billing"])


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def get_or_create_subscription(tenant: Tenant, db: Session) -> Subscription:
    """Return the tenant's Subscription row, creating it if it doesn't exist yet."""
    sub = db.query(Subscription).filter(Subscription.tenant_id == tenant.id).first()
    if not sub:
        sub = Subscription(tenant_id=tenant.id, subscription_tier="free", is_subscribed=False)
        db.add(sub)
        db.commit()
        db.refresh(sub)
    return sub


# ---------------------------------------------------------------------------
# GET /billing — current subscription status
# ---------------------------------------------------------------------------

@router.get("/billing", response_model=SubscriptionRead)
def get_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OWNER)),
):
    """Return the current tenant's subscription details. Owner only."""
    sub = get_or_create_subscription(current_user.tenant, db)
    return sub


# ---------------------------------------------------------------------------
# POST /billing/checkout-session — create a Stripe Checkout session
# ---------------------------------------------------------------------------

@router.post("/billing/checkout-session", response_model=CheckoutSessionResponse)
def create_checkout_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OWNER)),
):
    """
    Creates a Stripe Checkout session for the paid plan.
    - Creates a Stripe Customer for the tenant on first call and saves the ID.
    - Returns a URL the frontend redirects the user to.
    - On success Stripe calls our webhook which upgrades the subscription.
    """
    tenant = current_user.tenant

    # Create a Stripe customer once and reuse it for all future checkouts
    if not tenant.stripe_customer_id:
        customer = stripe.Customer.create(
            email=current_user.email,
            name=tenant.company_name,
            metadata={"tenant_id": str(tenant.id)},
        )
        tenant.stripe_customer_id = customer.id
        db.commit()

    session = stripe.checkout.Session.create(
        customer=tenant.stripe_customer_id,
        payment_method_types=["card"],
        mode="subscription",
        line_items=[{"price": settings.STRIPE_PAID_PRICE_ID, "quantity": 1}],
        success_url=f"{settings.FRONTEND_URL}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{settings.FRONTEND_URL}/billing/cancel",
        metadata={"tenant_id": str(tenant.id)},
    )

    return CheckoutSessionResponse(checkout_url=session.url)


# ---------------------------------------------------------------------------
# POST /webhooks/stripe — handle Stripe events
# ---------------------------------------------------------------------------

@router.post("/webhooks/stripe", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
    db: Session = Depends(get_db),
):
    """
    Stripe sends signed POST requests here after payment events.
    We verify the signature using the webhook secret to ensure
    the request is genuinely from Stripe and not a spoofed call.

    Events handled:
    - checkout.session.completed  → activate paid subscription
    - customer.subscription.updated → sync tier changes
    - customer.subscription.deleted → downgrade back to free
    """
    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except stripe.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid Stripe signature")

    event_type = event["type"]
    data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        _handle_checkout_completed(data, db)

    elif event_type == "customer.subscription.updated":
        _handle_subscription_updated(data, db)

    elif event_type == "customer.subscription.deleted":
        _handle_subscription_deleted(data, db)

    elif event_type == "invoice.payment_failed":
        _handle_payment_failed(data, db)

    return {"received": True}


# ---------------------------------------------------------------------------
# Private webhook handlers
# ---------------------------------------------------------------------------

def _get_tenant_by_stripe_customer(stripe_customer_id: str, db: Session) -> Tenant | None:
    return db.query(Tenant).filter(Tenant.stripe_customer_id == stripe_customer_id).first()


def _handle_checkout_completed(session: dict, db: Session) -> None:
    """Upgrade the tenant to paid after a successful checkout."""
    # Guard: only process subscription-mode sessions
    if not session.get("subscription"):
        return

    tenant = _get_tenant_by_stripe_customer(session["customer"], db)
    if not tenant:
        return

    stripe_subscription = stripe.Subscription.retrieve(session["subscription"])
    period_end = stripe_subscription["current_period_end"]

    sub = get_or_create_subscription(tenant, db)
    sub.is_subscribed = True
    sub.stripe_subscription_id = session["subscription"]
    sub.subscribed_at = datetime.now(timezone.utc)
    sub.current_period_end = datetime.fromtimestamp(period_end, tz=timezone.utc)

    # Mirror tier on the tenant row for fast lookups without joining subscription
    tenant.subscription_tier = "paid"

    db.commit()


def _handle_subscription_updated(subscription: dict, db: Session) -> None:
    """Sync subscription changes (renewal, reactivation, plan switch)."""
    tenant = _get_tenant_by_stripe_customer(subscription["customer"], db)
    if not tenant:
        return

    is_active = subscription["status"] == "active"

    sub = get_or_create_subscription(tenant, db)
    sub.current_period_end = datetime.fromtimestamp(
        subscription["current_period_end"], tz=timezone.utc
    )
    sub.is_subscribed = is_active

    # Sync tier on both rows — handles reactivation after cancellation
    if is_active:
        sub.subscription_tier = "paid"
        tenant.subscription_tier = "paid"
    else:
        sub.subscription_tier = "free"
        tenant.subscription_tier = "free"

    db.commit()


def _handle_subscription_deleted(subscription: dict, db: Session) -> None:
    """Downgrade tenant back to free when subscription is cancelled."""
    tenant = _get_tenant_by_stripe_customer(subscription["customer"], db)
    if not tenant:
        return

    sub = get_or_create_subscription(tenant, db)
    sub.subscription_tier = "free"
    sub.is_subscribed = False
    sub.stripe_subscription_id = None
    sub.current_period_end = None
    sub.subscribed_at = None

    tenant.subscription_tier = "free"

    db.commit()


def _handle_payment_failed(invoice: dict, db: Session) -> None:
    """Downgrade tenant when a renewal payment fails."""
    tenant = _get_tenant_by_stripe_customer(invoice["customer"], db)
    if not tenant:
        return

    sub = get_or_create_subscription(tenant, db)
    sub.subscription_tier = "free"
    sub.is_subscribed = False

    tenant.subscription_tier = "free"

    db.commit()
