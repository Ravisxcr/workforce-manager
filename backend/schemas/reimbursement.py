from datetime import date
from fastapi import Form, File, UploadFile
from dataclasses import dataclass
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class ReimbursementCreate(BaseModel):
    amount: float
    description: Optional[str]
    requested_date: date
    type: str


class ReimbursementUpdateStatus(BaseModel):
    status: str
    remarks: Optional[str]
    date_approved: Optional[date]
    approved_by_id: Optional[UUID]

class ReimbursementOut(BaseModel):
    id: UUID
    employee_id: UUID
    amount: str
    type: str
    description: Optional[str]
    requested_date: date
    status: str
    approved_by: Optional[UUID]
    date_approved: Optional[date]
    receipt_url: Optional[str]
    remarks: Optional[str]


class ReimbursementAnalytics(BaseModel):
    total_claims: int
    total_approved: int
    total_pending: int
    total_rejected: int
    total_amount: str
    claims: Optional[List[ReimbursementOut]] = None
