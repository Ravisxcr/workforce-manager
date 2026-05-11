from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import String
from sqlalchemy.orm import Session

from db.session import get_db
from models.department import Department, Designation
from models.user import Employee, IdCard, User
from schemas import MessageResponse
from schemas.auth import Role
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


def normalize_employee_relationships(
    employee_data: dict,
    db: Session,
    db_employee: Employee | None = None,
):
    department_id = employee_data.get(
        "department_id",
        db_employee.department_id if db_employee else None,
    )
    designation_id = employee_data.get(
        "designation_id",
        db_employee.designation_id if db_employee else None,
    )

    if (
        department_id
        and not db.query(Department).filter(Department.id == department_id).first()
    ):
        raise HTTPException(status_code=404, detail="Department not found")

    if not designation_id:
        return

    designation = db.query(Designation).filter(Designation.id == designation_id).first()
    if not designation:
        raise HTTPException(status_code=404, detail="Designation not found")

    if department_id and designation.department_id != department_id:
        raise HTTPException(
            status_code=400,
            detail="Designation does not belong to the selected department",
        )

    if not department_id:
        employee_data["department_id"] = designation.department_id


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=MessageResponse)
def create_employee(
    employee: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    employee_data = employee.dict()
    normalize_employee_relationships(employee_data, db)
    user_id = employee_data.pop("user_id", None)
    user = db.query(User).filter(User.id == user_id).first() if user_id else None

    if user_id and not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user:
        user = db.query(User).filter(User.email == employee.email).first()

    if not user:
        raise HTTPException(
            status_code=400,
            detail="Create a login user first or provide an existing user email",
        )

    existing_employee = (
        db.query(Employee)
        .filter((Employee.user_id == user.id) | (Employee.email == employee.email))
        .first()
    )
    if existing_employee:
        raise HTTPException(
            status_code=400,
            detail="Employee already exists for this user or email",
        )

    db_employee = Employee(
        **employee_data,
        user_id=user.id,
        created_by_admin_id=current_user.id,
    )
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return MessageResponse(
        message="Employee created successfully",
        data=EmployeeOut.model_validate(db_employee),
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
        q = q.join(Department, Employee.department_id == Department.id).filter(
            (Employee.department_id.cast(String) == department)
            | (Department.name == department)
        )
    if is_active is not None:
        q = q.filter(Employee.is_active == is_active)
    return MessageResponse(
        message="Employees retrieved successfully",
        data=[EmployeeOut.model_validate(r) for r in q.all()],
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
        .outerjoin(Department, Employee.department_id == Department.id)
        .outerjoin(Designation, Employee.designation_id == Designation.id)
        .filter(
            Employee.full_name.ilike(term)
            | Employee.email.ilike(term)
            | Department.name.ilike(term)
            | Designation.name.ilike(term)
        )
        .all()
    )
    return MessageResponse(
        message="Employees retrieved successfully",
        data=[EmployeeOut.model_validate(r) for r in employees],
    )


@router.get("/managers", response_model=MessageResponse)
def get_managers(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    managers = (
        db.query(Employee)
        .join(User, Employee.user_id == User.id)
        .filter(User.role == Role.MANAGER)
        .all()
    )
    if not managers:
        return MessageResponse(message="No managers found", data=[])
    return MessageResponse(
        message="Managers retrieved successfully",
        data=[EmployeeOut.model_validate(r) for r in managers],
    )


@router.patch("/{employee_id}/change-role/{role}", response_model=MessageResponse)
def change_employee_role(
    employee_id: UUID,
    role: Role,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    if role == Role.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="You cannot assign admin role",
        )

    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    user = db.query(User).filter(User.id == db_employee.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = role
    db.commit()
    db.refresh(db_employee)
    db.refresh(user)
    role = user.role.value if isinstance(user.role, Role) else user.role
    return MessageResponse(
        message="Employee role updated successfully",
        data={
            "employee": EmployeeOut.model_validate(db_employee),
            "role": role,
        },
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
        data=EmployeeOut.model_validate(db_employee),
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
    employee_data = employee.dict(exclude_unset=True)
    normalize_employee_relationships(employee_data, db, db_employee)
    for field, value in employee_data.items():
        setattr(db_employee, field, value)
    db.commit()
    db.refresh(db_employee)
    return MessageResponse(
        message="Employee updated successfully",
        data=EmployeeOut.model_validate(db_employee),
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
        data=EmployeeOut.model_validate(db_employee),
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
        message="ID card created successfully", data=IdCardOut.model_validate(id_card)
    )


@router.get("/id-card/verify/{user_id}", response_model=MessageResponse)
def verify_id_card(
    user_id: str,
    db: Session = Depends(get_db),
):
    cards = db.query(IdCard).filter(IdCard.user_id == user_id).all()
    return MessageResponse(
        message="ID cards verified successfully",
        data=[IdCardOut.model_validate(card) for card in cards],
    )


@router.get("/id-card/me", response_model=MessageResponse)
def get_my_id_cards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    cards = db.query(IdCard).filter(IdCard.user_id == str(current_user.id)).all()
    return MessageResponse(
        message="ID cards retrieved successfully",
        data=[IdCardOut.model_validate(card) for card in cards],
    )
