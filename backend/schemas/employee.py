from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr


class EmployeeCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    manager_id: Optional[UUID] = None


class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    manager_id: Optional[UUID] = None


class EmployeeOut(BaseModel):
    id: UUID
    full_name: str
    email: EmailStr
    phone: Optional[str]
    address: Optional[str]
    position: Optional[str]
    department: Optional[str]
    manager_id: Optional[UUID]
    admin_id: UUID

    class Config:
        orm_mode = True


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
