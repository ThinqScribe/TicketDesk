from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from core.dependencies import get_current_user
from core.email import send_verification_email, send_password_reset_email
from core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    create_email_verification_token,
    create_password_reset_token,
    decode_token,
    decode_special_token,
)
from db.database import get_db
from models.subscription import Subscription
from models.tenant import Tenant
from models.user import User, UserRole
from schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    ResetPasswordRequest,
    SignupRequest,
    TokenResponse,
    VerifyEmailRequest,
)

import re


router = APIRouter(prefix="/auth", tags=["auth"])


def slugify(name: str) -> str:
    """Convert a company name to a clean URL slug.
    'Acme & Co.' → 'acme-co'
    """
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)   # drop non-word chars except hyphens
    slug = re.sub(r"[\s_]+", "-", slug)    # spaces/underscores → hyphens
    slug = re.sub(r"-{2,}", "-", slug)     # collapse consecutive hyphens
    return slug.strip("-")


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    tenant = Tenant(company_name=payload.company_name, slug=slugify(payload.company_name))
    db.add(tenant)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="A company with this name already exists")

    # Create the free-tier subscription row alongside the tenant
    subscription = Subscription(
        tenant_id=tenant.id,
        subscription_tier="free",
        is_subscribed=False,
    )
    db.add(subscription)

    user = User(
        tenant_id=tenant.id,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=UserRole.OWNER,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    verification_token = create_email_verification_token(user.id)
    send_verification_email(user.email, verification_token)

    token_data = {"sub": str(user.id), "tenant_id": user.tenant_id, "tier": tenant.subscription_tier}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    
    # Check credentials
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Incorrect email or password"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Account is disabled. Contact your administrator."
        )

    # Generate tokens with proper data
    token_data = {
        "sub": str(user.id), 
        "tenant_id": user.tenant_id, 
        "tier": user.tenant.subscription_tier
    }
    
    try:
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token({"sub": str(user.id)})
        return TokenResponse(access_token=access_token, refresh_token=refresh_token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate authentication tokens"
        )


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    try:
        decoded = decode_token(payload.refresh_token)
        if decoded.get("type") != "refresh":
            raise ValueError
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.query(User).filter(User.id == int(decoded["sub"])).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    token_data = {"sub": str(user.id), "tenant_id": user.tenant_id, "tier": user.tenant.subscription_tier}
    access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=new_refresh_token)


@router.post("/resend-verification", response_model=MessageResponse)
def resend_verification(current_user: User = Depends(get_current_user)):
    if current_user.is_verified:
        raise HTTPException(status_code=400, detail="Email is already verified")

    token = create_email_verification_token(current_user.id)
    send_verification_email(current_user.email, token)
    return MessageResponse(message="Verification email sent")


@router.post("/verify-email", response_model=MessageResponse)
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    try:
        user_id = decode_special_token(payload.token, expected_type="email_verification")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_verified = True
    db.commit()
    return MessageResponse(message="Email verified successfully")


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        token = create_password_reset_token(user.id)
        send_password_reset_email(user.email, token)

    # Always return the same message regardless — prevents email enumeration
    return MessageResponse(message="If that email exists, a reset link has been sent")


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        user_id = decode_special_token(payload.token, expected_type="password_reset")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return MessageResponse(message="Password reset successfully")
