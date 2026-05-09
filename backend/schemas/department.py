from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    head_id: Optional[UUID] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    head_id: Optional[UUID] = None


class DepartmentOut(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    head_id: Optional[UUID] = None

    class Config:
        from_attributes = True


class DesignationCreate(BaseModel):
    name: str
    department_id: Optional[UUID] = None
    level: Optional[int] = None


class DesignationUpdate(BaseModel):
    name: Optional[str] = None
    department_id: Optional[UUID] = None
    level: Optional[int] = None


class DesignationOut(BaseModel):
    id: UUID
    name: str
    department_id: Optional[UUID] = None
    level: Optional[int] = None

    class Config:
        from_attributes = True
