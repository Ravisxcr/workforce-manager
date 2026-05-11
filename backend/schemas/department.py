from uuid import UUID

from pydantic import BaseModel, Field


class DepartmentHeadOut(BaseModel):
    id: UUID
    full_name: str | None = None
    email: str

    class Config:
        from_attributes = True


class DepartmentCreate(BaseModel):
    name: str
    code: str
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
    head: DepartmentHeadOut | None = None
    head_name: str | None = None
    parent_department_id: UUID | None = None
    is_active: bool = True
    designations: list["DesignationOut"] = Field(default_factory=list)

    class Config:
        from_attributes = True


class DesignationUpdate(BaseModel):
    name: str | None = None
    department_id: UUID | None = None
    min_salary: float | None = None
    max_salary: float | None = None
    level: int | None = None


class DesignationCreate(DesignationUpdate):
    department_id: UUID | None = None


class DesignationOut(BaseModel):
    id: UUID
    name: str
    min_salary: float | None = None
    max_salary: float | None = None
    department_id: UUID | None = None
    level: int | None = None

    class Config:
        from_attributes = True
