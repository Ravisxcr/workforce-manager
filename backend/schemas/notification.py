from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class NotificationSend(BaseModel):
    employee_id: UUID
    title: str
    message: str
    type: str = "info"
    link: Optional[str] = None


class NotificationBroadcast(BaseModel):
    employee_ids: List[UUID]
    title: str
    message: str
    type: str = "info"
    link: Optional[str] = None


class NotificationOut(BaseModel):
    id: UUID
    employee_id: UUID
    title: str
    message: str
    is_read: bool
    type: str
    link: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
