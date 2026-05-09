from datetime import date, datetime
from typing import List, Optional
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
    allowances: Optional[float] = 0.0
    deductions: Optional[float] = 0.0
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
    remarks: Optional[str] = None

    class Config:
        from_attributes = True


class SalarySlipUpdate(BaseModel):
    month: Optional[str] = None
    year: Optional[int] = None
    basic: Optional[float] = None
    hra: Optional[float] = None
    allowances: Optional[float] = None
    deductions: Optional[float] = None
    net_pay: Optional[float] = None
    date_generated: Optional[date] = None


class SalaryHistoryUpdate(BaseModel):
    amount: Optional[float] = None
    date: Optional[datetime] = None
    remarks: Optional[str] = None


class SalaryAnalyticsItem(BaseModel):
    employee_id: str
    total_slips: int
    avg_net_pay: float
    latest_net_pay: Optional[float] = None


class SalaryAnalytics(BaseModel):
    total_employees: int
    avg_salary: float
    employees: List[SalaryAnalyticsItem]
