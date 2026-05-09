from uuid import UUID

from pydantic import BaseModel


class DepartmentCreate(BaseModel):
    name: str
    description: str | None = None
    head_id: UUID | None = None


class DepartmentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    head_id: UUID | None = None


class DepartmentOut(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    head_id: UUID | None = None

    class Config:
        from_attributes = True


class DesignationCreate(BaseModel):
    name: str
    department_id: UUID | None = None
    level: int | None = None


class DesignationUpdate(BaseModel):
    name: str | None = None
    department_id: UUID | None = None
    level: int | None = None


class DesignationOut(BaseModel):
    id: UUID
    name: str
    department_id: UUID | None = None
    level: int | None = None

    class Config:
        from_attributes = True
