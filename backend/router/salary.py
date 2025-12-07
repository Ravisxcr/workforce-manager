from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.session import get_db
from models.salary import SalaryHistory, SalarySlip
from models.user import User
from schemas.salary import (
    SalaryHistoryCreate,
    SalaryHistoryOut,
    SalarySlipCreate,
    SalarySlipOut,
)
from services.auth import get_current_active_user

router = APIRouter()


@router.post("/salary-slip", response_model=SalarySlipOut)
def create_salary_slip(
    slip: SalarySlipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    salary_slip = SalarySlip(**slip.dict())
    db.add(salary_slip)
    db.commit()
    db.refresh(salary_slip)
    return salary_slip


@router.get("/salary-slip/{employee_id}", response_model=list[SalarySlipOut])
def get_salary_slips(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    slips = db.query(SalarySlip).filter(SalarySlip.employee_id == employee_id).all()
    return slips


@router.post("/salary-history", response_model=SalaryHistoryOut)
def create_salary_history(
    history: SalaryHistoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    salary_history = SalaryHistory(**history.dict())
    db.add(salary_history)
    db.commit()
    db.refresh(salary_history)
    return salary_history


@router.get("/salary-history", response_model=list[SalaryHistoryOut])
def get_salary_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    history = (
        db.query(SalaryHistory)
        .filter(SalaryHistory.employee_id == current_user.id)
        .all()
    )
    return history
