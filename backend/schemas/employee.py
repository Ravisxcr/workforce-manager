from datetime import date
from uuid import UUID

from pydantic import BaseModel, EmailStr

from schemas.auth import Role


class EmployeeCreate(BaseModel):
    user_id: UUID | None = None
    full_name: str
    email: EmailStr
    phone: str | None = None
    address: str | None = None
    designation_id: UUID | None = None
    department_id: UUID | None = None
    dob: date | None = None
    gender: str | None = None
    date_joined: date | None = None
    salary: str | None = None
    manager_id: UUID | None = None


class EmployeeUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None
    designation_id: UUID | None = None
    department_id: UUID | None = None
    dob: date | None = None
    gender: str | None = None
    date_joined: date | None = None
    salary: str | None = None
    manager_id: UUID | None = None


class EmployeeOut(BaseModel):
    id: UUID
    user_id: UUID
    full_name: str
    email: EmailStr
    phone: str | None = None
    address: str | None = None
    designation_id: UUID | None = None
    department_id: UUID | None = None
    designation: str | None = None
    department: str | None = None
    dob: date | None = None
    gender: str | None = None
    date_joined: date | None = None
    salary: str | None = None
    manager_id: UUID | None = None
    created_by_admin_id: UUID
    is_active: bool = True
    role: Role | None = None

    class Config:
        from_attributes = True


class EmployeeStatusUpdate(BaseModel):
    is_active: bool


class IdCardCreate(BaseModel):
    user_id: str
    name: str
    designation: str
    department: str
    issue_date: str
    expiry_date: str
    card_number: str


class IdCardOut(IdCardCreate):
    id: str

    class Config:
        from_attributes = True
