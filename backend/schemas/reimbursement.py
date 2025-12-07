from datetime import date
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class ReimbursementCreate(BaseModel):
    amount: str
    description: Optional[str] = None
    date: date
    type: str


class ReimbursementUpdateStatus(BaseModel):
    status: str
    remarks: Optional[str] = None
    date_approved: Optional[date] = None
    approved_by_id: Optional[UUID] = None


class ReimbursementOut(BaseModel):
    id: UUID
    employee_id: UUID
    amount: str
    description: Optional[str]
    date_requested: date
    status: str
    approved_by_id: Optional[UUID]
    date_approved: Optional[date]
    receipt_url: Optional[str]
    remarks: Optional[str]

    class Config:
        orm_mode = True


class ReimbursementAnalytics(BaseModel):
    total_claims: int
    total_approved: int
    total_pending: int
    total_rejected: int
    total_amount: str
    claims: Optional[List[ReimbursementOut]] = None
