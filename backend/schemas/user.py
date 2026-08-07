from enum import Enum
from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict


class UserRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    AGENT = "agent"


class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str


class UserCreate(UserBase):
    role: UserRole = UserRole.AGENT


class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
