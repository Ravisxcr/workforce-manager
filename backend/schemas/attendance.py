from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


class AttendanceCheckIn(BaseModel):
    notes: str | None = None


class AttendanceCheckOut(BaseModel):
    notes: str | None = None


class AttendanceManualEntry(BaseModel):
    employee_id: UUID
    date: date
    check_in: datetime | None = None
    check_out: datetime | None = None
    status: str = "present"
    notes: str | None = None


class AttendanceUpdate(BaseModel):
    check_in: datetime | None = None
    check_out: datetime | None = None
    status: str | None = None
    notes: str | None = None


class AttendanceOut(BaseModel):
    id: UUID
    employee_id: UUID
    date: date
    check_in: datetime | None = None
    check_out: datetime | None = None
    status: str
    work_hours: float | None = None
    notes: str | None = None
    is_manual: bool

    class Config:
        from_attributes = True


class AttendanceAnalytics(BaseModel):
    employee_id: str
    employee_name: str
    total_days: int
    present_days: int
    absent_days: int
    late_days: int
    half_days: int
    avg_work_hours: float | None = None
