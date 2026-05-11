from sqlalchemy import Boolean, Column, Date, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from db.base import Base, IdMixin, TimestampMixin


class Leave(Base, TimestampMixin, IdMixin):
    __tablename__ = "leaves"

    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    user = relationship("User", back_populates="leaves", foreign_keys=[user_id])
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    # Remove days column from DB, calculate dynamically

    @property
    def days(self):
        if self.start_date and self.end_date:
            return (self.end_date - self.start_date).days + 1
        return 0

    reason = Column(String, nullable=True)
    status = Column(String, default="pending")
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    approver = relationship("User", foreign_keys=[approved_by])
    type = Column(String, nullable=True)
    cancellation_requested = Column(Boolean, default=False)
    cancellation_approved = Column(Boolean, default=False)


# Reimbursement table for reimbursement management
class Reimbursement(Base, TimestampMixin, IdMixin):
    __tablename__ = "reimbursements"

    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    user = relationship("User", back_populates="reimbursements", foreign_keys=[user_id])
    amount = Column(String, nullable=False)
    description = Column(String, nullable=True)
    date = Column(Date, nullable=False)
    status = Column(String, default="pending")
    approved_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    approver = relationship("User", foreign_keys=[approved_by_id])
    date_approved = Column(Date, nullable=True)
    receipt_url = Column(String, nullable=True)
    remarks = Column(String, nullable=True)
