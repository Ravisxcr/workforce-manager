from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


class SalarySlipCreate(BaseModel):
    employee_id: UUID
    month: str
    year: int
    basic: float
    hra: float
    allowances: float = 0.0
    deductions: float = 0.0
    net_pay: float
    date_generated: date


class SalarySlipOut(BaseModel):
    id: UUID
    employee_id: UUID
    month: str
    year: int
    basic: float
    hra: float
    allowances: float | None = 0.0
    deductions: float | None = 0.0
    net_pay: float
    date_generated: date

    class Config:
        from_attributes = True


class SalaryHistoryCreate(BaseModel):
    employee_id: UUID
    amount: float
    date: datetime
    remarks: str = ""


class SalaryHistoryOut(BaseModel):
    id: UUID
    employee_id: UUID
    amount: float
    date: datetime
    remarks: str | None = None

    class Config:
        from_attributes = True


class SalarySlipUpdate(BaseModel):
    month: str | None = None
    year: int | None = None
    basic: float | None = None
    hra: float | None = None
    allowances: float | None = None
    deductions: float | None = None
    net_pay: float | None = None
    date_generated: date | None = None


class SalaryHistoryUpdate(BaseModel):
    amount: float | None = None
    date: datetime | None = None
    remarks: str | None = None


class SalaryAnalyticsItem(BaseModel):
    employee_id: str
    total_slips: int
    avg_net_pay: float
    latest_net_pay: float | None = None


class SalaryAnalytics(BaseModel):
    total_employees: int
    avg_salary: float
    employees: list[SalaryAnalyticsItem]
