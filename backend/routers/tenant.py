from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.dependencies import get_current_user
from db.database import get_db
from models.user import User
from schemas.tenant import TenantRead

router = APIRouter(prefix="/tenant", tags=["tenant"])


@router.get("/me", response_model=TenantRead)
def get_my_tenant(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the current user's tenant details."""
    return current_user.tenant
