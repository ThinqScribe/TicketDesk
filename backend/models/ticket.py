from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from db.database import Base


class Ticket(Base):
    __tablename__ = "ticket"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenant.id"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customer.id"), nullable=False)
    assigned_agent_id = Column(Integer, ForeignKey("user.id"), nullable=True)

    subject = Column(String, nullable=False)
    description = Column(String, nullable=False)
    status = Column(String, nullable=False, default="open")
    priority = Column(String, nullable=False, default="normal")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    closed_at = Column(DateTime(timezone=True), nullable=True, default=None)

    # Relationships
    customer = relationship("Customer", back_populates="tickets")
    assigned_agent = relationship("User", back_populates="assigned_tickets")
    tenant = relationship("Tenant", back_populates="tickets")
    comments = relationship("Comment", back_populates="ticket")
