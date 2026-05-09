from datetime import date
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class ReimbursementCreate(BaseModel):
    amount: str
    description: Optional[str] = None
    date: date
    type: str


class ReimbursementUpdate(BaseModel):
    amount: Optional[str] = None
    description: Optional[str] = None
    date: Optional[date] = None
    type: Optional[str] = None


class ReimbursementUpdateStatus(BaseModel):
    status: str
    remarks: Optional[str] = None
    date_approved: Optional[date] = None


class ReimbursementOut(BaseModel):
    id: UUID
    employee_id: UUID
    amount: str
    description: Optional[str] = None
    date: date
    type: str
    status: str
    approved_by_id: Optional[UUID] = None
    date_approved: Optional[date] = None
    receipt_url: Optional[str] = None
    remarks: Optional[str] = None

    class Config:
        from_attributes = True


class ReimbursementAnalytics(BaseModel):
    total_claims: int
    total_approved: int
    total_pending: int
    total_rejected: int
    total_amount: str
    claims: Optional[List[ReimbursementOut]] = None
