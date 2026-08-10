from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from core.dependencies import get_current_user, require_role
from core.email import send_invite_email
from core.quota import check_agent_quota
from core.security import generate_password, hash_password
from db.database import get_db
from models.user import User, UserRole
from schemas.user import UserCreate, UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])
logger = logging.getLogger(__name__)


@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile, including tenant name."""
    return UserRead.from_orm_with_tenant(current_user)


@router.get("/", response_model=list[UserRead])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OWNER, UserRole.ADMIN)),
):
    """List all users belonging to the current tenant."""
    users = db.query(User).filter(User.tenant_id == current_user.tenant_id).all()
    return [UserRead.model_validate(u) for u in users]


@router.patch("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = db.query(User).filter(
        User.id == user_id,
        User.tenant_id == current_user.tenant_id,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    is_self = user.id == current_user.id
    is_owner = current_user.role == UserRole.OWNER

    if payload.first_name is not None:
        if not is_self and not is_owner:
            raise HTTPException(status_code=403, detail="You can only update your own profile")
        user.first_name = payload.first_name

    if payload.last_name is not None:
        if not is_self and not is_owner:
            raise HTTPException(status_code=403, detail="You can only update your own profile")
        user.last_name = payload.last_name

    if payload.role is not None:
        if not is_owner:
            raise HTTPException(status_code=403, detail="Only owners can change roles")
        if is_self:
            raise HTTPException(status_code=400, detail="You cannot change your own role")
        user.role = payload.role

    if payload.is_active is not None:
        if not is_owner:
            raise HTTPException(status_code=403, detail="Only owners can activate or deactivate users")
        if is_self:
            raise HTTPException(status_code=400, detail="You cannot deactivate yourself")
        user.is_active = payload.is_active

    # Notification settings - users can update their own
    if payload.notify_new_tickets is not None:
        if not is_self and not is_owner:
            raise HTTPException(status_code=403, detail="You can only update your own notification settings")
        user.notify_new_tickets = payload.notify_new_tickets

    if payload.notify_ticket_updates is not None:
        if not is_self and not is_owner:
            raise HTTPException(status_code=403, detail="You can only update your own notification settings")
        user.notify_ticket_updates = payload.notify_ticket_updates

    if payload.notify_comments is not None:
        if not is_self and not is_owner:
            raise HTTPException(status_code=403, detail="You can only update your own notification settings")
        user.notify_comments = payload.notify_comments

    db.commit()
    db.refresh(user)
    return UserRead.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OWNER)),
):
    """
    Permanently remove a user from the tenant.
    Only owners can remove users. Cannot remove yourself.
    """
    user = db.query(User).filter(
        User.id == user_id,
        User.tenant_id == current_user.tenant_id,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot remove yourself")
    if user.role == UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Cannot remove another owner")

    db.delete(user)
    db.commit()
    logger.info(f"User {user.email} (id={user.id}) removed by {current_user.email}")


@router.post("/invite", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def invite_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OWNER, UserRole.ADMIN)),
):
    """
    Invite a new user to the tenant.
    - Owners can invite admins and agents.
    - Admins can only invite agents.
    """
    # Check quota manually instead of using dependency
    check_agent_quota(db, current_user)
    
    logger.info(f"User invitation request: email={payload.email}, role={payload.role}, invited_by={current_user.email}")
    
    # Role-based authorization
    if current_user.role == UserRole.ADMIN and payload.role != UserRole.AGENT:
        logger.warning(f"Admin {current_user.email} attempted to invite {payload.role} role - not allowed")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins can only invite agents",
        )

    # Check for existing user with same email
    existing_user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing_user:
        logger.warning(f"Invite failed: user with email {payload.email} already exists")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="A user with this email already exists"
        )

    # Generate secure password
    password = generate_password()

    try:
        # Create new user
        new_user = User(
            tenant_id=current_user.tenant_id,
            email=payload.email.lower().strip(),
            hashed_password=hash_password(password),
            first_name=payload.first_name.strip(),
            last_name=payload.last_name.strip(),
            role=payload.role,
            is_verified=True,  # Invited users are verified — the invite itself confirms identity
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        logger.info(f"User created successfully: id={new_user.id}, email={new_user.email}")

        # Send invitation email
        try:
            send_invite_email(
                to_email=new_user.email,
                invited_by=f"{current_user.first_name} {current_user.last_name}",
                company_name=current_user.tenant.company_name,
                temporary_password=password,
            )
            logger.info(f"Invitation email sent to {new_user.email}")
        except Exception as email_error:
            logger.error(f"Failed to send invitation email to {new_user.email}: {email_error}")
            # Don't fail the whole invitation if email fails
        
        return UserRead.model_validate(new_user)
        
    except Exception as e:
        logger.error(f"Failed to create user invitation: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user invitation",
        )
