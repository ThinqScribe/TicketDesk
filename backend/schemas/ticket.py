from enum import Enum
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TicketStatus(str, Enum):
    OPEN = "open"
    PENDING = "pending"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class TicketCreate(BaseModel):
    """Fields the caller must supply when opening a ticket."""
    subject: str
    description: str
    customer_id: int
    priority: TicketPriority = TicketPriority.NORMAL


class TicketUpdate(BaseModel):
    """All fields optional — caller patches only what they need to change."""
    subject: str | None = None
    description: str | None = None
    priority: TicketPriority | None = None
    status: TicketStatus | None = None
    assigned_agent_id: int | None = None


class TicketRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    customer_id: int
    assigned_agent_id: int | None
    subject: str
    description: str
    status: TicketStatus
    priority: TicketPriority
    created_at: datetime
    updated_at: datetime | None
    closed_at: datetime | None
