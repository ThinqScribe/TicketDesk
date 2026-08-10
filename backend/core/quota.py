from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.dependencies import get_current_user
from db.database import get_db
from models.ticket import Ticket
from models.user import User, UserRole

# Free tier hard limits
FREE_TIER_MAX_OPEN_TICKETS = 50
FREE_TIER_MAX_AGENTS = 3


def check_ticket_quota(
    db: Session,
    current_user: User,
) -> None:
    """
    Dependency injected into POST /tickets.
    Blocks ticket creation if the tenant is on the free tier and has
    reached 50 open tickets.
    Paid tenants are never blocked.
    """
    if current_user.tenant.subscription_tier == "paid":
        return

    open_tickets = db.query(Ticket).filter(
        Ticket.tenant_id == current_user.tenant_id,
        Ticket.status == "open",
    ).count()

    if open_tickets >= FREE_TIER_MAX_OPEN_TICKETS:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=(
                f"Free tier limit reached: {FREE_TIER_MAX_OPEN_TICKETS} open tickets. "
                "Upgrade to paid to create more tickets."
            ),
        )


def ticket_quota_dependency(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """FastAPI dependency wrapper for check_ticket_quota."""
    check_ticket_quota(db, current_user)


def check_agent_quota(
    db: Session,
    current_user: User,
) -> None:
    """
    Dependency injected into POST /users/invite.
    Blocks agent invitations if the tenant is on the free tier and has
    reached 3 agents.
    Paid tenants are never blocked.
    """
    # Skip quota check for paid tenants
    if current_user.tenant.subscription_tier == "paid":
        return

    # Count active agents for this tenant
    agent_count = db.query(User).filter(
        User.tenant_id == current_user.tenant_id,
        User.role == UserRole.AGENT,
        User.is_active == True,
    ).count()

    # Check if adding one more agent would exceed the limit
    if agent_count >= FREE_TIER_MAX_AGENTS:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=(
                f"Free tier limit reached: {FREE_TIER_MAX_AGENTS} agents maximum. "
                f"You currently have {agent_count} active agents. "
                "Upgrade to paid plan to invite more agents."
            ),
        )


def agent_quota_dependency(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """FastAPI dependency wrapper for check_agent_quota."""
    check_agent_quota(db, current_user)
