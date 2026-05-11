from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from db.base import Base, IdMixin, TimestampMixin


class SalarySlip(Base, TimestampMixin, IdMixin):
    __tablename__ = "salary_slips"
    __table_args__ = (
        UniqueConstraint("user_id", "month", "year", name="uq_user_month_year"),
    )

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="salary_slips", foreign_keys=[user_id])
    month = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    basic = Column(Float, nullable=False)
    hra = Column(Float, nullable=False)
    allowances = Column(Float, nullable=True)
    deductions = Column(Float, nullable=True)
    net_pay = Column(Float, nullable=False)
    date_generated = Column(Date, nullable=False)


class SalaryHistory(Base, TimestampMixin, IdMixin):
    __tablename__ = "salary_history"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="salary_history", foreign_keys=[user_id])
    amount = Column(Float, nullable=False)
    date = Column(DateTime, nullable=False)
    remarks = Column(String, nullable=True)
