from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from db.base import Base, IdMixin, TimestampMixin


class Attendance(Base, TimestampMixin, IdMixin):
    __tablename__ = "attendance"

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    date = Column(Date, nullable=False, index=True)
    check_in = Column(DateTime, nullable=True)
    check_out = Column(DateTime, nullable=True)
    # present / absent / late / half-day / on-leave
    status = Column(String, default="present")
    work_hours = Column(Float, nullable=True)
    notes = Column(String, nullable=True)
    is_manual = Column(Boolean, default=False)
    marked_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    user = relationship("User", back_populates="attendances", foreign_keys=[user_id])
    marked_by = relationship("User", foreign_keys=[marked_by_id])
