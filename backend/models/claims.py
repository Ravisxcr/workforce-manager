import uuid

from sqlalchemy import Boolean, Column, Date, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID

from db.base import Base, TimestampMixin


class Leave(Base, TimestampMixin):
    __tablename__ = "leaves"
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
    )
    employee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
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
    type = Column(String, nullable=True)
    cancellation_requested = Column(Boolean, default=False)
    cancellation_approved = Column(Boolean, default=False)


# Reimbursement table for reimbursement management
class Reimbursement(Base, TimestampMixin):
    __tablename__ = "reimbursements"
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
    )
    employee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    amount = Column(String, nullable=False)
    type = Column(String, nullable=False)
    description = Column(String, nullable=True)
    requested_date = Column(Date, nullable=False)
    status = Column(String, default="pending")
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    date_approved = Column(Date, nullable=True)
    receipt_url = Column(String, nullable=True)
    remarks = Column(String, nullable=True)
