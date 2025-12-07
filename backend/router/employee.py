from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.session import get_db
from models.user import Employee, IdCard, User
from schemas.employee import (
    EmployeeCreate,
    EmployeeOut,
    EmployeeUpdate,
    IdCardCreate,
    IdCardOut,
)
from services.auth import admin_required, get_current_active_user

router = APIRouter()


@router.post("/", response_model=EmployeeOut)
def create_employee(
    employee: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    db_employee = Employee(**employee.dict(), created_by_admin_id=current_user.id)
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee


@router.put("/{employee_id}", response_model=EmployeeOut)
def update_employee(
    employee_id: str,
    employee: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    for field, value in employee.dict(exclude_unset=True).items():
        setattr(db_employee, field, value)
    db.commit()
    db.refresh(db_employee)
    return db_employee


@router.delete("/{employee_id}", status_code=204)
def delete_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.delete(db_employee)
    db.commit()
    return None


@router.post("/id-card", response_model=IdCardOut)
def create_id_card(
    card: IdCardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    id_card = IdCard(**card.dict())
    db.add(id_card)
    db.commit()
    db.refresh(id_card)
    return id_card


@router.get("/id-card/verify/{employee_id}", response_model=list[IdCardOut])
def verify_id_card(
    employee_id: int,
    db: Session = Depends(get_db),
):
    cards = db.query(IdCard).filter(IdCard.employee_id == employee_id).all()
    return cards


@router.get("/id-card", response_model=list[IdCardOut])
def get_id_card(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    cards = db.query(IdCard).filter(IdCard.employee_id == current_user.id).all()
    return cards


# get all the manager with theri id and name
@router.get("/managers", response_model=list[EmployeeOut])
def get_managers(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    managers = db.query(Employee).filter(Employee.is_manager == True).all()
    return managers
