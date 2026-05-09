from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from db.session import get_db
from models.user import Employee, IdCard, User
from schemas import MessageResponse
from schemas.employee import (
    EmployeeCreate,
    EmployeeOut,
    EmployeeStatusUpdate,
    EmployeeUpdate,
    IdCardCreate,
    IdCardOut,
)
from services.auth import admin_required, get_current_active_user

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=MessageResponse)
def create_employee(
    employee: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    db_employee = Employee(**employee.dict(), created_by_admin_id=current_user.id)
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return MessageResponse(
        message="Employee created successfully", 
        data=EmployeeOut.model_validate(db_employee)
    )


@router.get("/", response_model=MessageResponse)
def list_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
    department: str | None = Query(None),
    is_active: bool | None = Query(None),
):
    q = db.query(Employee)
    if department:
        q = q.filter(Employee.department == department)
    if is_active is not None:
        q = q.filter(Employee.is_active == is_active)
    return MessageResponse(
        message="Employees retrieved successfully",
        data=[EmployeeOut.model_validate(r) for r in q.all()]
    )


@router.get("/search", response_model=MessageResponse)
def search_employees(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    term = f"%{q}%"
    employees = (
        db.query(Employee)
        .filter(
            Employee.full_name.ilike(term)
            | Employee.email.ilike(term)
            | Employee.department.ilike(term)
            | Employee.designation.ilike(term)
        )
        .all()
    )
    return MessageResponse(
        message="Employees retrieved successfully",
        data=[EmployeeOut.model_validate(r) for r in employees]
    )


@router.get("/managers", response_model=MessageResponse)
def get_managers(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    # Managers are employees who appear as manager_id on at least one other employee
    manager_ids = (
        db.query(Employee.manager_id)
        .filter(Employee.manager_id.isnot(None))
        .distinct()
        .all()
    )
    ids = [r[0] for r in manager_ids]
    if not ids:
        return MessageResponse(message="No managers found", data=[])
    return MessageResponse(
        message="Managers retrieved successfully",
        data=[EmployeeOut.model_validate(r) for r in db.query(Employee).filter(Employee.id.in_(ids)).all()]
    )


@router.get("/{employee_id}", response_model=MessageResponse)
def get_employee(
    employee_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return MessageResponse(
        message="Employee retrieved successfully",
        data=EmployeeOut.model_validate(db_employee)
    )


@router.put("/{employee_id}", response_model=MessageResponse)
def update_employee(
    employee_id: UUID,
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
    return MessageResponse(
        message="Employee updated successfully",
        data=EmployeeOut.model_validate(db_employee)
    )


@router.patch("/{employee_id}/status", response_model=MessageResponse)
def update_employee_status(
    employee_id: UUID,
    status: EmployeeStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    db_employee.is_active = status.is_active
    db.commit()
    db.refresh(db_employee)
    return MessageResponse(
        message="Employee status updated successfully",
        data=EmployeeOut.model_validate(db_employee)
    )


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.delete(db_employee)
    db.commit()
    return None


@router.post("/id-card", response_model=MessageResponse)
def create_id_card(
    card: IdCardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    id_card = IdCard(**card.dict())
    db.add(id_card)
    db.commit()
    db.refresh(id_card)
    return MessageResponse(
        message="ID card created successfully",
        data=IdCardOut.model_validate(id_card)
    )


@router.get("/id-card/verify/{employee_id}", response_model=MessageResponse)
def verify_id_card(
    employee_id: str,
    db: Session = Depends(get_db),
):
    cards = db.query(IdCard).filter(IdCard.employee_id == employee_id).all()
    return MessageResponse(
        message="ID cards verified successfully",
        data=[IdCardOut.model_validate(card) for card in cards]
    )


@router.get("/id-card/me", response_model=MessageResponse)
def get_my_id_cards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    cards = db.query(IdCard).filter(IdCard.employee_id == str(current_user.id)).all()
    return MessageResponse(
        message="ID cards retrieved successfully",
        data=[IdCardOut.model_validate(card) for card in cards]
    )
