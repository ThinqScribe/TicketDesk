from enum import Enum
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, ConfigDict


class UserRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin" 
    AGENT = "agent"


class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str


class UserCreate(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole = UserRole.AGENT


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    notify_new_tickets: Optional[bool] = None
    notify_ticket_updates: Optional[bool] = None
    notify_comments: Optional[bool] = None


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    role: UserRole
    is_active: bool
    is_verified: bool
    notify_new_tickets: bool
    notify_ticket_updates: bool
    notify_comments: bool
    created_at: datetime
    updated_at: datetime
    company_name: str = ""
    tenant_slug: str = ""

    @classmethod
    def from_orm_with_tenant(cls, user) -> "UserRead":
        """Build a UserRead from an ORM User, pulling in tenant fields."""
        instance = cls.model_validate(user)
        if user.tenant is not None:
            instance.company_name = user.tenant.company_name or ""
            instance.tenant_slug = user.tenant.slug or ""
        return instance
