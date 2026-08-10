from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import logging

from core.security import decode_token
from db.database import get_db
from models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
logger = logging.getLogger(__name__)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode the JWT token
        payload = decode_token(token)
        
        # Validate token type
        if payload.get("type") != "access":
            logger.warning(f"Invalid token type: {payload.get('type')}")
            raise credentials_exception

        user_id = payload.get("sub")
        tenant_id = payload.get("tenant_id")

        # Validate required fields
        if user_id is None or tenant_id is None:
            logger.warning(f"Missing user_id or tenant_id in token payload: user_id={user_id}, tenant_id={tenant_id}")
            raise credentials_exception
            
        # Convert to integers safely
        try:
            user_id = int(user_id)
            tenant_id = int(tenant_id)
        except (ValueError, TypeError):
            logger.warning(f"Invalid user_id or tenant_id format: user_id={user_id}, tenant_id={tenant_id}")
            raise credentials_exception
            
    except (ValueError, AttributeError) as e:
        logger.warning(f"Token validation error: {e}")
        raise credentials_exception

    # Query user from database
    user = db.query(User).filter(
        User.id == user_id,
        User.tenant_id == tenant_id,
    ).first()

    if user is None:
        logger.warning(f"User not found: user_id={user_id}, tenant_id={tenant_id}")
        raise credentials_exception
        
    if not user.is_active:
        logger.warning(f"Inactive user attempted access: user_id={user_id}, email={user.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    return user


def require_role(*allowed_roles: UserRole):
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to perform this action",
            )
        return current_user
    return dependency
