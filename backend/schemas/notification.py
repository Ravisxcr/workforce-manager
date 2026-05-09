from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class NotificationSend(BaseModel):
    employee_id: UUID
    title: str
    message: str
    type: str = "info"
    link: str | None = None


class NotificationBroadcast(BaseModel):
    employee_ids: list[UUID]
    title: str
    message: str
    type: str = "info"
    link: str | None = None


class NotificationOut(BaseModel):
    id: UUID
    employee_id: UUID
    title: str
    message: str
    is_read: bool
    type: str
    link: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
