from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.session import get_db
from models.salary import SalaryHistory, SalarySlip
from models.user import User
from schemas.salary import (
    SalaryAnalytics,
    SalaryAnalyticsItem,
    SalaryHistoryCreate,
    SalaryHistoryOut,
    SalaryHistoryUpdate,
    SalarySlipCreate,
    SalarySlipOut,
    SalarySlipUpdate,
)
from services.auth import admin_required, get_current_active_user

router = APIRouter()


@router.post("/salary-slip", response_model=SalarySlipOut)
def create_salary_slip(
    slip: SalarySlipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    salary_slip = SalarySlip(**slip.dict())
    db.add(salary_slip)
    db.commit()
    db.refresh(salary_slip)
    return salary_slip


@router.get("/salary-slip/me", response_model=list[SalarySlipOut])
def get_my_salary_slips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return db.query(SalarySlip).filter(SalarySlip.employee_id == current_user.id).all()


@router.get("/salary-slip/{employee_id}", response_model=list[SalarySlipOut])
def get_salary_slips(
    employee_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if str(current_user.id) != str(employee_id) and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(SalarySlip).filter(SalarySlip.employee_id == employee_id).all()


@router.post("/salary-history", response_model=SalaryHistoryOut)
def create_salary_history(
    history: SalaryHistoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    salary_history = SalaryHistory(**history.dict())
    db.add(salary_history)
    db.commit()
    db.refresh(salary_history)
    return salary_history


@router.get("/salary-history/me", response_model=list[SalaryHistoryOut])
def get_my_salary_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return (
        db.query(SalaryHistory)
        .filter(SalaryHistory.employee_id == current_user.id)
        .order_by(SalaryHistory.date.desc())
        .all()
    )


@router.get("/salary-history", response_model=list[SalaryHistoryOut])
def get_salary_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return (
        db.query(SalaryHistory)
        .filter(SalaryHistory.employee_id == current_user.id)
        .order_by(SalaryHistory.date.desc())
        .all()
    )


@router.get("/analytics", response_model=SalaryAnalytics)
def get_salary_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    slips = db.query(SalarySlip).all()
    if not slips:
        return SalaryAnalytics(total_employees=0, avg_salary=0.0, employees=[])

    by_employee: dict = {}
    for slip in slips:
        eid = str(slip.employee_id)
        by_employee.setdefault(eid, []).append(slip)

    items = []
    all_net = []
    for eid, emp_slips in by_employee.items():
        net_pays = [s.net_pay for s in emp_slips]
        all_net.extend(net_pays)
        latest = sorted(emp_slips, key=lambda s: (s.year, s.month), reverse=True)[0]
        items.append(
            SalaryAnalyticsItem(
                employee_id=eid,
                total_slips=len(emp_slips),
                avg_net_pay=sum(net_pays) / len(net_pays),
                latest_net_pay=latest.net_pay,
            )
        )

    return SalaryAnalytics(
        total_employees=len(by_employee),
        avg_salary=sum(all_net) / len(all_net),
        employees=items,
    )


@router.get("/salary-slip", response_model=list[SalarySlipOut])
def list_all_salary_slips(
    employee_id: UUID | None = Query(None),
    month: str | None = Query(None),
    year: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    q = db.query(SalarySlip)
    if employee_id:
        q = q.filter(SalarySlip.employee_id == employee_id)
    if month:
        q = q.filter(SalarySlip.month == month)
    if year:
        q = q.filter(SalarySlip.year == year)
    return q.order_by(SalarySlip.year.desc(), SalarySlip.date_generated.desc()).all()


@router.put("/salary-slip/{slip_id}", response_model=SalarySlipOut)
def update_salary_slip(
    slip_id: UUID,
    body: SalarySlipUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    slip = db.query(SalarySlip).filter(SalarySlip.id == slip_id).first()
    if not slip:
        raise HTTPException(status_code=404, detail="Salary slip not found")
    for field, value in body.dict(exclude_unset=True).items():
        setattr(slip, field, value)
    db.commit()
    db.refresh(slip)
    return slip


@router.delete("/salary-slip/{slip_id}", status_code=204)
def delete_salary_slip(
    slip_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    slip = db.query(SalarySlip).filter(SalarySlip.id == slip_id).first()
    if not slip:
        raise HTTPException(status_code=404, detail="Salary slip not found")
    db.delete(slip)
    db.commit()
    return None


@router.get("/salary-history/{employee_id}", response_model=list[SalaryHistoryOut])
def get_employee_salary_history(
    employee_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    return (
        db.query(SalaryHistory)
        .filter(SalaryHistory.employee_id == employee_id)
        .order_by(SalaryHistory.date.desc())
        .all()
    )


@router.put("/salary-history/{history_id}", response_model=SalaryHistoryOut)
def update_salary_history(
    history_id: UUID,
    body: SalaryHistoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    record = db.query(SalaryHistory).filter(SalaryHistory.id == history_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Salary history not found")
    for field, value in body.dict(exclude_unset=True).items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/salary-history/{history_id}", status_code=204)
def delete_salary_history(
    history_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    record = db.query(SalaryHistory).filter(SalaryHistory.id == history_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Salary history not found")
    db.delete(record)
    db.commit()
    return None
