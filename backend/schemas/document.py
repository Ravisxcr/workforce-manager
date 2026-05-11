import datetime
from uuid import UUID

from pydantic import BaseModel


class DocumentUpload(BaseModel):
    document_type: str
    description: str | None = None


class DocumentOut(BaseModel):
    id: UUID
    user_id: UUID
    document_type: str
    description: str | None
    file_path: str
    status: str
    verified_by_id: UUID | None
    verified_at: datetime.datetime | None
    comment: str | None

    class Config:
        from_attributes = True


class DocumentVerify(BaseModel):
    status: str
    comment: str | None = None
    verified_by_id: UUID | None = None
    verified_at: datetime.datetime | None = None
