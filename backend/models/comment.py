from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from db.database import Base


class Comment(Base):
    __tablename__ = "comment"

    __table_args__ = (
        # Exactly one of author_user_id / author_customer_id must be set.
        CheckConstraint(
            "(author_user_id IS NOT NULL) != (author_customer_id IS NOT NULL)",
            name="ck_comment_single_author",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("ticket.id"), nullable=False)

    # One of these is set — the other is NULL.
    author_user_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    author_customer_id = Column(Integer, ForeignKey("customer.id"), nullable=True)

    body = Column(String, nullable=False)
    is_internal = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    ticket = relationship("Ticket", back_populates="comments")
    author_user = relationship("User", foreign_keys=[author_user_id])
    author_customer = relationship("Customer", foreign_keys=[author_customer_id])
