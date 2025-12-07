from datetime import date, datetime

from pydantic import BaseModel


class SalarySlipCreate(BaseModel):
    employee_id: str
    month: str
    year: int
    basic: float
    hra: float
    allowances: float = 0.0
    deductions: float = 0.0
    net_pay: float
    date_generated: date


class SalarySlipOut(SalarySlipCreate):
    id: str


class SalaryHistoryCreate(BaseModel):
    employee_id: str
    amount: float
    date: datetime
    remarks: str = ""


class SalaryHistoryOut(SalaryHistoryCreate):
    id: str
