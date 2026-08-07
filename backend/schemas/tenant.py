from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TenantCreate(BaseModel):
    company_name: str


class TenantRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_name: str
    slug: str
    stripe_customer_id: str | None
    subscription_tier: str
    created_at: datetime
    updated_at: datetime
