from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.dependencies import get_current_user, require_role
from core.email import send_invite_email
from core.quota import check_agent_quota
from core.security import generate_password, hash_password
from db.database import get_db
from models.user import User, UserRole
from schemas.user import UserCreate, UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user


@router.get("/", response_model=list[UserRead])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OWNER, UserRole.ADMIN)),
):
    """List all users belonging to the current tenant. Owner and admin only."""
    return db.query(User).filter(User.tenant_id == current_user.tenant_id).all()


@router.patch("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a user's profile or status.

    Rules:
    - Any user can update their own first_name and last_name.
    - Only owners can change another user's role or is_active flag.
    - Users cannot change their own role or deactivate themselves.
    """
    # Scope the lookup to the current tenant — no cross-tenant access
    user = db.query(User).filter(
        User.id == user_id,
        User.tenant_id == current_user.tenant_id,
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    is_self = user.id == current_user.id
    is_owner = current_user.role == UserRole.OWNER

    # Name fields — any user can update their own; owners can update anyone's
    if payload.first_name is not None:
        if not is_self and not is_owner:
            raise HTTPException(status_code=403, detail="You can only update your own profile")
        user.first_name = payload.first_name

    if payload.last_name is not None:
        if not is_self and not is_owner:
            raise HTTPException(status_code=403, detail="You can only update your own profile")
        user.last_name = payload.last_name

    # Privileged fields — owner only, and cannot target yourself
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

    db.commit()
    db.refresh(user)
    return user


@router.post("/invite", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def invite_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.OWNER, UserRole.ADMIN)),
    _quota: None = Depends(check_agent_quota),
):
    """
    Invite a new user to the tenant.
    - Owners can invite admins and agents.
    - Admins can only invite agents.
    A secure password is auto-generated and emailed to the invitee.
    """
    if current_user.role == UserRole.ADMIN and payload.role != UserRole.AGENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins can only invite agents",
        )

    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    password = generate_password()

    new_user = User(
        tenant_id=current_user.tenant_id,
        email=payload.email,
        hashed_password=hash_password(password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=payload.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    send_invite_email(
        to_email=new_user.email,
        invited_by=f"{current_user.first_name} {current_user.last_name}",
        company_name=current_user.tenant.company_name,
        temporary_password=password,
    )

    return new_user
