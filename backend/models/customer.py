from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from db.database import Base


class Customer(Base):
    __tablename__ = "customer"
    __table_args__ = (
        UniqueConstraint("tenant_id", "email", name="uq_customer_tenant_email"),
    )

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenant.id"), nullable=False, index=True)

    name = Column(String, nullable=False)
    email = Column(String, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    tenant = relationship("Tenant", back_populates="customers")
    tickets = relationship("Ticket", back_populates="customer")
