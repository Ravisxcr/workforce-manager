import uuid

from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID

from db.base import Base, TimestampMixin


class Attendance(Base, TimestampMixin):
    __tablename__ = "attendance"
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
    )
    employee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    check_in = Column(DateTime, nullable=True)
    check_out = Column(DateTime, nullable=True)
    # present / absent / late / half-day / on-leave
    status = Column(String, default="present")
    work_hours = Column(Float, nullable=True)
    notes = Column(String, nullable=True)
    is_manual = Column(Boolean, default=False)
    marked_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
