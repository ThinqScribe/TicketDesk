from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.dependencies import get_current_user
from db.database import get_db
from models.comment import Comment
from models.ticket import Ticket
from models.user import User, UserRole
from schemas.comment import CommentCreate, CommentRead

router = APIRouter(prefix="/tickets", tags=["comments"])


def get_ticket_or_404(ticket_id: int, tenant_id: int, db: Session) -> Ticket:
    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id,
        Ticket.tenant_id == tenant_id,
    ).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.get("/{ticket_id}/comments", response_model=list[CommentRead])
def list_comments(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List comments on a ticket.
    - Agents can only see comments on tickets assigned to them.
    - Agents never see internal (is_internal=True) comments.
    - Admins and owners see all comments.
    """
    ticket = get_ticket_or_404(ticket_id, current_user.tenant_id, db)

    if current_user.role == UserRole.AGENT and ticket.assigned_agent_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have access to this ticket")

    query = db.query(Comment).filter(Comment.ticket_id == ticket.id)

    if current_user.role == UserRole.AGENT:
        query = query.filter(Comment.is_internal == False)  # noqa: E712

    return query.order_by(Comment.created_at).all()


@router.post("/{ticket_id}/comments", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
def add_comment(
    ticket_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Add a comment to a ticket.
    - Agents can only comment on tickets assigned to them.
    - Agents cannot post internal comments (is_internal is forced False).
    - Admins and owners can post internal or public comments on any ticket.
    """
    ticket = get_ticket_or_404(ticket_id, current_user.tenant_id, db)

    if current_user.role == UserRole.AGENT and ticket.assigned_agent_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have access to this ticket")

    is_internal = payload.is_internal if current_user.role != UserRole.AGENT else False

    comment = Comment(
        ticket_id=ticket.id,
        author_user_id=current_user.id,
        body=payload.body,
        is_internal=is_internal,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment
