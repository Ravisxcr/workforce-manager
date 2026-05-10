from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload, selectinload

from db.session import get_db
from models.department import Department, Designation
from models.user import User
from schemas import MessageResponse
from schemas.department import (
    DepartmentCreate,
    DepartmentOut,
    DepartmentUpdate,
    DesignationCreate,
    DesignationOut,
    DesignationUpdate,
)
from services.auth import admin_required, get_current_active_user

router = APIRouter()


def serialize_department(department: Department) -> DepartmentOut:
    department_out = DepartmentOut.model_validate(department)
    if department.head:
        department_out.head_name = department.head.full_name
    return department_out


# ── Department CRUD ───────────────────────────────────────────────────────────


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=MessageResponse)
def create_department(
    body: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    if db.query(Department).filter(Department.name == body.name).first():
        raise HTTPException(status_code=400, detail="Department already exists")
    dept = Department(**body.dict())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return MessageResponse(
        message="Department created successfully",
        data=serialize_department(dept)
    )


@router.get("/", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def list_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    response = (
        db.query(Department)
        .options(
            joinedload(Department.head),
            selectinload(Department.designations),
        )
        .all()
    )
    return MessageResponse(
        message="Departments retrieved successfully",
        data=[serialize_department(r) for r in response]
    )


@router.put("/{department_id}", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def update_department(
    department_id: UUID,
    body: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    for field, value in body.dict(exclude_unset=True).items():
        setattr(dept, field, value)
    db.commit()
    db.refresh(dept)
    return MessageResponse(
        message="Department updated successfully",
        data=serialize_department(dept)
    )


@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(
    department_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()
    return None


# ── Designation CRUD ──────────────────────────────────────────────────────────


@router.post("/designation", status_code=status.HTTP_201_CREATED, response_model=MessageResponse)
def create_designation(
    body: DesignationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    desig = Designation(**body.dict())
    db.add(desig)
    db.commit()
    db.refresh(desig)
    return MessageResponse(
        message="Designation created successfully",
        data=DesignationOut.model_validate(desig)
    )


@router.get("/designation", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def list_designations(
    department_id: UUID = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = db.query(Designation)
    if department_id:
        q = q.filter(Designation.department_id == department_id)
    
    return MessageResponse(
        message="Designations retrieved successfully",
        data=[DesignationOut.model_validate(r) for r in q.all()]
    )


@router.put("/designation/{designation_id}", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def update_designation(
    designation_id: UUID,
    body: DesignationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    desig = db.query(Designation).filter(Designation.id == designation_id).first()
    if not desig:
        raise HTTPException(status_code=404, detail="Designation not found")
    for field, value in body.dict(exclude_unset=True).items():
        setattr(desig, field, value)
    db.commit()
    db.refresh(desig)
    return MessageResponse(
        message="Designation updated successfully",
        data=DesignationOut.model_validate(desig)
    )


@router.delete("/designation/{designation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_designation(
    designation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    desig = db.query(Designation).filter(Designation.id == designation_id).first()
    if not desig:
        raise HTTPException(status_code=404, detail="Designation not found")
    db.delete(desig)
    db.commit()
    return None
