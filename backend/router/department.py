from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.session import get_db
from models.department import Department, Designation
from schemas.department import (DepartmentCreate, DepartmentOut,
                                DepartmentUpdate, DesignationCreate,
                                DesignationOut, DesignationUpdate)
from services.auth import admin_required, get_current_active_user
from models.user import User

router = APIRouter()


# ── Department CRUD ───────────────────────────────────────────────────────────

@router.post("/", response_model=DepartmentOut)
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
    return dept


@router.get("/", response_model=List[DepartmentOut])
def list_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return db.query(Department).all()


@router.put("/{department_id}", response_model=DepartmentOut)
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
    return dept


@router.delete("/{department_id}", status_code=204)
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

@router.post("/designation", response_model=DesignationOut)
def create_designation(
    body: DesignationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    desig = Designation(**body.dict())
    db.add(desig)
    db.commit()
    db.refresh(desig)
    return desig


@router.get("/designation", response_model=List[DesignationOut])
def list_designations(
    department_id: UUID = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = db.query(Designation)
    if department_id:
        q = q.filter(Designation.department_id == department_id)
    return q.all()


@router.put("/designation/{designation_id}", response_model=DesignationOut)
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
    return desig


@router.delete("/designation/{designation_id}", status_code=204)
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
