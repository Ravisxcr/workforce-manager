from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from db.session import get_db
from models.salary import SalaryHistory, SalarySlip
from models.user import User
from schemas import MessageResponse
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


@router.post(
    "/salary-slip", status_code=status.HTTP_201_CREATED, response_model=MessageResponse
)
def create_salary_slip(
    slip: SalarySlipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    salary_slip = SalarySlip(**slip.dict())
    db.add(salary_slip)
    db.commit()
    db.refresh(salary_slip)
    return MessageResponse(
        message="Salary slip created successfully",
        data=SalarySlipOut.model_validate(salary_slip),
    )


@router.get(
    "/salary-slip/me", status_code=status.HTTP_200_OK, response_model=MessageResponse
)
def get_my_salary_slips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    response = db.query(SalarySlip).filter(SalarySlip.user_id == current_user.id).all()
    return MessageResponse(
        message="Salary slips retrieved successfully",
        data=[SalarySlipOut.model_validate(slip) for slip in response],
    )


@router.get(
    "/salary-slip/{user_id}",
    status_code=status.HTTP_200_OK,
    response_model=MessageResponse,
)
def get_salary_slips(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if str(current_user.id) != str(user_id) and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )
    response = db.query(SalarySlip).filter(SalarySlip.user_id == user_id).all()
    return MessageResponse(
        message="Salary slips retrieved successfully",
        data=[SalarySlipOut.model_validate(slip) for slip in response],
    )


@router.post(
    "/salary-history",
    status_code=status.HTTP_201_CREATED,
    response_model=MessageResponse,
)
def create_salary_history(
    history: SalaryHistoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    salary_history = SalaryHistory(**history.dict())
    db.add(salary_history)
    db.commit()
    db.refresh(salary_history)
    return MessageResponse(
        message="Salary history created successfully",
        data=SalaryHistoryOut.model_validate(salary_history),
    )


@router.get(
    "/salary-history/me", status_code=status.HTTP_200_OK, response_model=MessageResponse
)
def get_my_salary_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    response = (
        db.query(SalaryHistory)
        .filter(SalaryHistory.user_id == current_user.id)
        .order_by(SalaryHistory.date.desc())
        .all()
    )
    return MessageResponse(
        message="Salary history retrieved successfully",
        data=[SalaryHistoryOut.model_validate(history) for history in response],
    )


@router.get(
    "/salary-history", status_code=status.HTTP_200_OK, response_model=MessageResponse
)
def get_salary_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    response = (
        db.query(SalaryHistory)
        .filter(SalaryHistory.user_id == current_user.id)
        .order_by(SalaryHistory.date.desc())
        .all()
    )
    return MessageResponse(
        message="Salary history retrieved successfully",
        data=[SalaryHistoryOut.model_validate(history) for history in response],
    )


@router.get(
    "/analytics", status_code=status.HTTP_200_OK, response_model=MessageResponse
)
def get_salary_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    slips = db.query(SalarySlip).all()
    if not slips:
        return MessageResponse(
            message="No salary slips found",
            data=SalaryAnalytics(total_employees=0, avg_salary=0.0, employees=[]),
        )

    by_employee: dict = {}
    for slip in slips:
        eid = str(slip.user_id)
        by_employee.setdefault(eid, []).append(slip)

    items = []
    all_net = []
    for eid, emp_slips in by_employee.items():
        net_pays = [s.net_pay for s in emp_slips]
        all_net.extend(net_pays)
        latest = sorted(emp_slips, key=lambda s: (s.year, s.month), reverse=True)[0]
        items.append(
            SalaryAnalyticsItem(
                user_id=eid,
                total_slips=len(emp_slips),
                avg_net_pay=sum(net_pays) / len(net_pays),
                latest_net_pay=latest.net_pay,
            )
        )

    return MessageResponse(
        message="Salary analytics retrieved successfully",
        data=SalaryAnalytics(
            total_employees=len(by_employee),
            avg_salary=sum(all_net) / len(all_net),
            employees=items,
        ),
    )


@router.get(
    "/salary-slip", status_code=status.HTTP_200_OK, response_model=MessageResponse
)
def list_all_salary_slips(
    user_id: UUID | None = Query(None),
    month: str | None = Query(None),
    year: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    q = db.query(SalarySlip)
    if user_id:
        q = q.filter(SalarySlip.user_id == user_id)
    if month:
        q = q.filter(SalarySlip.month == month)
    if year:
        q = q.filter(SalarySlip.year == year)
    response = q.order_by(
        SalarySlip.year.desc(), SalarySlip.date_generated.desc()
    ).all()
    return MessageResponse(
        message="Salary slips retrieved successfully",
        data=[SalarySlipOut.model_validate(slip) for slip in response],
    )


@router.put(
    "/salary-slip/{slip_id}",
    status_code=status.HTTP_200_OK,
    response_model=MessageResponse,
)
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
    return MessageResponse(
        message="Salary slip updated successfully",
        data=SalarySlipOut.model_validate(slip),
    )


@router.delete("/salary-slip/{slip_id}", status_code=status.HTTP_204_NO_CONTENT)
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


@router.get(
    "/salary-history/{user_id}",
    status_code=status.HTTP_200_OK,
    response_model=MessageResponse,
)
def get_employee_salary_history(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    response = (
        db.query(SalaryHistory)
        .filter(SalaryHistory.user_id == user_id)
        .order_by(SalaryHistory.date.desc())
        .all()
    )
    return MessageResponse(
        message="Salary history retrieved successfully",
        data=[SalaryHistoryOut.model_validate(history) for history in response],
    )


@router.put(
    "/salary-history/{history_id}",
    status_code=status.HTTP_200_OK,
    response_model=MessageResponse,
)
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
    return MessageResponse(
        message="Salary history updated successfully",
        data=SalaryHistoryOut.model_validate(record),
    )


@router.delete("/salary-history/{history_id}", status_code=status.HTTP_204_NO_CONTENT)
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
