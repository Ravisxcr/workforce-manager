from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class LeaveCreate(BaseModel):
    start_date: date
    end_date: date
    type: str = ""
    reason: str = ""


class LeaveUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    type: Optional[str] = None
    reason: Optional[str] = None



class LeaveOut(LeaveCreate):
    id: UUID
    employee_id: UUID
    start_date: date
    end_date: date
    reason: str = ""
    status: str = ""
    days: int = 0
    approved_by: str | None = None
    cancellation_requested: bool = False
    cancellation_approved: bool = False

class LeaveListResponse(BaseModel):
    data: list[LeaveOut]
    extra: dict[str, int]


class LeaveAnalyticsItem(BaseModel):
    employee_id: str
    employee_name: str
    approved_leaves: int
    cancelled_leaves: int
    pending_leaves: int
    total_leaves: int
    cancellation_requests: int


class LeaveAnalyticsResponse(BaseModel):
    analytics: list[LeaveAnalyticsItem]
