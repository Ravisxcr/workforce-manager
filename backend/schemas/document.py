from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class DocumentUpload(BaseModel):
    document_type: str
    description: Optional[str] = None


class DocumentOut(BaseModel):
    id: str
    employee_id: str
    document_type: str
    description: Optional[str]
    file_path: str
    status: str
    verified_by_id: Optional[str]
    verified_at: Optional[datetime]
    comment: Optional[str]

    class Config:
        from_attributes = True


class DocumentVerify(BaseModel):
    status: str
    comment: Optional[str] = None
    verified_by_id: Optional[UUID] = None
    verified_at: Optional[datetime] = None
