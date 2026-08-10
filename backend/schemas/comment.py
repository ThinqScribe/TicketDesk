from datetime import datetime

from pydantic import BaseModel, ConfigDict, model_validator


class CommentCreate(BaseModel):
    body: str
    is_internal: bool = False


class CommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ticket_id: int
    author_user_id: int | None
    author_customer_id: int | None
    author_name: str = ""       # resolved display name
    author_initials: str = ""   # e.g. "MT"
    body: str
    is_internal: bool
    created_at: datetime

    @model_validator(mode="after")
    def resolve_author(self) -> "CommentRead":
        """Populate author_name and author_initials from the ORM relationships."""
        # These are set by the router after construction — nothing to do here.
        return self
