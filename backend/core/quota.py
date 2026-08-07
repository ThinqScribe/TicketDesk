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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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


def check_agent_quota(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Dependency injected into POST /users/invite.
    Blocks agent invitations if the tenant is on the free tier and has
    reached 3 agents.
    Paid tenants are never blocked.
    """
    if current_user.tenant.subscription_tier == "paid":
        return

    agent_count = db.query(User).filter(
        User.tenant_id == current_user.tenant_id,
        User.role == UserRole.AGENT,
        User.is_active == True,
    ).count()

    if agent_count >= FREE_TIER_MAX_AGENTS:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=(
                f"Free tier limit reached: {FREE_TIER_MAX_AGENTS} agents. "
                "Upgrade to paid to invite more agents."
            ),
        )
