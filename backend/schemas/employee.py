from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr


class EmployeeCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    dob: Optional[date] = None
    gender: Optional[str] = None
    date_joined: Optional[date] = None
    salary: Optional[str] = None
    manager_id: Optional[UUID] = None


class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    dob: Optional[date] = None
    gender: Optional[str] = None
    date_joined: Optional[date] = None
    salary: Optional[str] = None
    manager_id: Optional[UUID] = None


class EmployeeOut(BaseModel):
    id: UUID
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    dob: Optional[date] = None
    gender: Optional[str] = None
    date_joined: Optional[date] = None
    salary: Optional[str] = None
    manager_id: Optional[UUID] = None
    created_by_admin_id: UUID
    is_active: bool = True

    class Config:
        from_attributes = True


class EmployeeStatusUpdate(BaseModel):
    is_active: bool


class IdCardCreate(BaseModel):
    employee_id: str
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
