from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from db.database import Base

class Tenant(Base):
    __tablename__ = 'tenant'
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, unique=True,nullable=False)
    slug = Column(String, unique=True,nullable=False, index=True)


    stripe_customer_id = Column(String, nullable=True)
    subscription_tier = Column(String, default="free", nullable=False)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

#------------------relationships----------------------------
    
    users = relationship("User", back_populates="tenant")
    customers = relationship("Customer", back_populates="tenant")
    tickets = relationship("Ticket", back_populates="tenant")
    subscriptions = relationship("Subscription", back_populates="tenant", uselist=False)

