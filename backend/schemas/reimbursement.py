import datetime
from datetime import date
from uuid import UUID

from pydantic import BaseModel


class ReimbursementCreate(BaseModel):
    amount: str
    description: str | None = None
    date: date
    remarks: str


class ReimbursementUpdate(BaseModel):
    amount: str | None = None
    description: str | None = None
    date: datetime.date | None = None
    remarks: str | None = None


class ReimbursementUpdateStatus(BaseModel):
    status: str
    remarks: str | None = None
    date_approved: datetime.date | None = None


class ReimbursementOut(BaseModel):
    id: UUID
    user_id: UUID
    amount: str
    description: str | None = None
    date: datetime.date
    status: str
    approved_by_id: UUID | None = None
    date_approved: datetime.date | None = None
    receipt_url: str | None = None
    remarks: str | None = None

    class Config:
        from_attributes = True


class ReimbursementAnalytics(BaseModel):
    total_claims: int
    total_approved: int
    total_pending: int
    total_rejected: int
    total_amount: str
    claims: list[ReimbursementOut] | None = None
