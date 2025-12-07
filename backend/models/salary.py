import uuid

from sqlalchemy import (Column, Date, DateTime, Float, ForeignKey, Integer,
                        String)
from sqlalchemy.dialects.postgresql import UUID

from db.base import Base, TimestampMixin


class SalarySlip(Base, TimestampMixin):
    __tablename__ = "salary_slips"
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
    )
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    month = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    basic = Column(Float, nullable=False)
    hra = Column(Float, nullable=False)
    allowances = Column(Float, nullable=True)
    deductions = Column(Float, nullable=True)
    net_pay = Column(Float, nullable=False)
    date_generated = Column(Date, nullable=False)


class SalaryHistory(Base, TimestampMixin):
    __tablename__ = "salary_history"
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        index=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
    )
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(DateTime, nullable=False)
    remarks = Column(String, nullable=True)
