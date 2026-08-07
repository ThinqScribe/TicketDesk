from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CommentCreate(BaseModel):
    body: str
    is_internal: bool = False


class CommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ticket_id: int
    author_user_id: int | None
    author_customer_id: int | None
    body: str
    is_internal: bool
    created_at: datetime
