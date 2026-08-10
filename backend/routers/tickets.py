from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from core.dependencies import get_current_user, require_role
from core.email import send_ticket_confirmation_email, send_ticket_resolved_email
from core.quota import ticket_quota_dependency
from db.database import get_db
from models.customer import Customer
from models.ticket import Ticket
from models.user import User, UserRole
from schemas.ticket import TicketCreate, TicketPriority, TicketRead, TicketStatus, TicketUpdate

router = APIRouter(prefix="/tickets", tags=["tickets"])


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

@router.get("/stats")
def get_ticket_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns ticket counts grouped by status and priority for the current tenant.
    Agents only see stats for tickets assigned to them.
    """
    base = db.query(Ticket).filter(Ticket.tenant_id == current_user.tenant_id)
    if current_user.role == UserRole.AGENT:
        base = base.filter(Ticket.assigned_agent_id == current_user.id)

    # Count by status
    status_rows = (
        base.with_entities(Ticket.status, func.count(Ticket.id))
        .group_by(Ticket.status)
        .all()
    )
    by_status = {row[0]: row[1] for row in status_rows}

    # Count by priority (open tickets only)
    priority_rows = (
        base.filter(Ticket.status == "open")
        .with_entities(Ticket.priority, func.count(Ticket.id))
        .group_by(Ticket.priority)
        .all()
    )
    by_priority = {row[0]: row[1] for row in priority_rows}

    total = sum(by_status.values())

    return {
        "total": total,
        "by_status": {
            "open": by_status.get("open", 0),
            "pending": by_status.get("pending", 0),
            "resolved": by_status.get("resolved", 0),
            "closed": by_status.get("closed", 0),
        },
        "by_priority": {
            "urgent": by_priority.get("urgent", 0),
            "high": by_priority.get("high", 0),
            "normal": by_priority.get("normal", 0),
            "low": by_priority.get("low", 0),
        },
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_ticket_or_404(ticket_id: int, tenant_id: int, db: Session) -> Ticket:
    """Fetch a ticket scoped to the tenant, raise 404 if not found."""
    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id,
        Ticket.tenant_id == tenant_id,
    ).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


def _apply_status(ticket: Ticket, new_status: TicketStatus) -> None:
    """Set ticket status and manage closed_at timestamp accordingly."""
    ticket.status = new_status.value
    if new_status == TicketStatus.CLOSED:
        ticket.closed_at = datetime.now(timezone.utc)
    elif new_status == TicketStatus.OPEN and ticket.closed_at is not None:
        # Only clear closed_at when explicitly re-opening a ticket.
        ticket.closed_at = None


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/", response_model=list[TicketRead])
def list_tickets(
    status: TicketStatus | None = Query(None, description="Filter by status"),
    priority: TicketPriority | None = Query(None, description="Filter by priority"),
    assigned_to_me: bool = Query(False, description="Agents: show only my tickets"),
    q: str | None = Query(None, description="Search subject or description"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List tickets for the current tenant.
    - Agents only see tickets assigned to them.
    - Admins and owners see all tickets; use assigned_to_me=true to self-filter.
    - Optional filters: status, priority, q (text search on subject/description).
    - Pagination via skip/limit.
    """
    query = db.query(Ticket).filter(Ticket.tenant_id == current_user.tenant_id)

    if current_user.role == UserRole.AGENT:
        query = query.filter(Ticket.assigned_agent_id == current_user.id)
    elif assigned_to_me:
        query = query.filter(Ticket.assigned_agent_id == current_user.id)

    if status:
        query = query.filter(Ticket.status == status.value)
    if priority:
        query = query.filter(Ticket.priority == priority.value)
    if q:
        search = f"%{q.lower()}%"
        query = query.filter(
            func.lower(Ticket.subject).like(search) | func.lower(Ticket.description).like(search)
        )

    return query.order_by(Ticket.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=TicketRead, status_code=status.HTTP_201_CREATED)
def create_ticket(
    payload: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OWNER, UserRole.ADMIN)),
    _quota: None = Depends(ticket_quota_dependency),
):
    """
    Create a new ticket. Only admins and owners can open tickets.
    - tenant_id is taken from the authenticated user — never from the request body.
    - customer_id is validated to belong to the same tenant.
    """
    # Guard: customer must belong to this tenant
    customer = db.query(Customer).filter(
        Customer.id == payload.customer_id,
        Customer.tenant_id == current_user.tenant_id,
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    ticket = Ticket(
        tenant_id=current_user.tenant_id,
        customer_id=customer.id,
        subject=payload.subject,
        description=payload.description,
        priority=payload.priority.value,
        status=TicketStatus.OPEN.value,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    # Notify the customer their complaint has been received
    try:
        send_ticket_confirmation_email(
            to_email=customer.email,
            customer_name=customer.name,
            ticket_id=ticket.id,
            subject=ticket.subject,
            company_name=current_user.tenant.company_name,
        )
    except Exception:
        pass  # Never let email failure break ticket creation

    return ticket


@router.get("/{ticket_id}", response_model=TicketRead)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch a single ticket.
    Agents can only fetch tickets assigned to them.
    """
    ticket = get_ticket_or_404(ticket_id, current_user.tenant_id, db)

    if current_user.role == UserRole.AGENT and ticket.assigned_agent_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have access to this ticket")

    return ticket


@router.patch("/{ticket_id}", response_model=TicketRead)
def update_ticket(
    ticket_id: int,
    payload: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a ticket's fields.
    - Agents can only update status on tickets assigned to them.
    - Admins and owners can update all fields including assignment.
    - assigned_agent_id is validated to belong to the same tenant.
    """
    ticket = get_ticket_or_404(ticket_id, current_user.tenant_id, db)

    if current_user.role == UserRole.AGENT:
        if ticket.assigned_agent_id != current_user.id:
            raise HTTPException(status_code=403, detail="You don't have access to this ticket")
        if payload.status is not None:
            _apply_status(ticket, payload.status)
    else:
        if payload.subject is not None:
            ticket.subject = payload.subject
        if payload.description is not None:
            ticket.description = payload.description
        if payload.priority is not None:
            ticket.priority = payload.priority.value
        if payload.status is not None:
            _apply_status(ticket, payload.status)
        if payload.assigned_agent_id is not None:
            # Guard: agent must belong to the same tenant
            agent = db.query(User).filter(
                User.id == payload.assigned_agent_id,
                User.tenant_id == current_user.tenant_id,
                User.is_active == True,
            ).first()
            if not agent:
                raise HTTPException(status_code=404, detail="Agent not found")
            ticket.assigned_agent_id = agent.id

    db.commit()
    db.refresh(ticket)

    # Notify the customer if their ticket was resolved or closed
    if payload.status is not None and payload.status in (TicketStatus.RESOLVED, TicketStatus.CLOSED):
        try:
            send_ticket_resolved_email(
                to_email=ticket.customer.email,
                customer_name=ticket.customer.name,
                ticket_id=ticket.id,
                subject=ticket.subject,
                company_name=current_user.tenant.company_name,
                status=ticket.status,
            )
        except Exception:
            pass  # Never let email failure break the update

    return ticket


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OWNER, UserRole.ADMIN)),
):
    """
    Permanently delete a ticket and all its comments.
    Owner and admin only.
    """
    ticket = get_ticket_or_404(ticket_id, current_user.tenant_id, db)
    db.delete(ticket)
    db.commit()
