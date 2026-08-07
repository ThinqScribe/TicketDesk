from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SubscriptionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    subscription_tier: str
    is_subscribed: bool
    subscribed_at: datetime | None
    current_period_end: datetime | None
    # stripe_subscription_id is intentionally excluded — internal only


class CheckoutSessionResponse(BaseModel):
    checkout_url: str
