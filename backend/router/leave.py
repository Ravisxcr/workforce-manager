from datetime import datetime, time
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from db.session import get_db
from models.claims import Leave
from models.user import User
from schemas.leave import (
    LeaveAnalyticsItem,
    LeaveAnalyticsResponse,
    LeaveCreate,
    LeaveListResponse,
    LeaveOut,
    LeaveUpdate,
)
from schemas import MessageResponse
from services.auth import get_current_active_user
from services.auth import admin_required, get_current_active_user

router = APIRouter()

# ── helpers ──────────────────────────────────────────────────────────────────


def _leave_to_out(leave_obj: Leave, db: Session) -> LeaveOut:
    approver_name = None
    if leave_obj.approved_by:
        approver = db.query(User).filter(User.id == leave_obj.approved_by).first()
        if approver:
            approver_name = approver.full_name or approver.email
    return LeaveOut(
        id=str(leave_obj.id),
        user_id=str(leave_obj.user_id),
        start_date=leave_obj.start_date,
        end_date=leave_obj.end_date,
        type=leave_obj.type or "",
        reason=leave_obj.reason or "",
        status=leave_obj.status or "",
        days=leave_obj.days,
        approved_by=approver_name,
        cancellation_requested=leave_obj.cancellation_requested or False,
        cancellation_approved=leave_obj.cancellation_approved or False,
    )


def _days_expr():
    return func.julianday(Leave.end_date) - func.julianday(Leave.start_date) + 1


# ── create ───────────────────────────────────────────────────────────────────


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=MessageResponse)
def create_leave(
    leave: LeaveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    leave_obj = Leave(**leave.dict(), user_id=current_user.id, status="pending")
    db.add(leave_obj)
    db.commit()
    db.refresh(leave_obj)
    return MessageResponse(
        message="Leave request created successfully",
        data=LeaveOut.model_validate(_leave_to_out(leave_obj, db)),
    )



# ── list own + balance ────────────────────────────────────────────────────────


@router.get("/", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def get_leaves(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    leaves = db.query(Leave).filter(Leave.user_id == current_user.id).all()
    stmt = select(
        func.sum(case((Leave.type == "casual", _days_expr()), else_=0)).label(
            "casual_leave"
        ),
        func.sum(case((Leave.type == "sick", _days_expr()), else_=0)).label(
            "sick_leave"
        ),
        func.sum(case((Leave.type == "earned", _days_expr()), else_=0)).label(
            "earned_leave"
        ),
    ).where(Leave.user_id == current_user.id, Leave.status == "approved")
    result = db.execute(stmt).one()
    return MessageResponse(
        message="Leaves retrieved successfully",
        data= LeaveListResponse(
            data=[_leave_to_out(lv, db) for lv in leaves],
            extra={
                "casual_leave": result.casual_leave or 0,
                "sick_leave": result.sick_leave or 0,
                "earned_leave": result.earned_leave or 0,
            },
    ))


@router.get("/balance", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def get_leave_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    stmt = select(
        func.sum(case((Leave.type == "casual", _days_expr()), else_=0)).label(
            "casual_leave"
        ),
        func.sum(case((Leave.type == "sick", _days_expr()), else_=0)).label(
            "sick_leave"
        ),
        func.sum(case((Leave.type == "earned", _days_expr()), else_=0)).label(
            "earned_leave"
        ),
    ).where(Leave.user_id == current_user.id, Leave.status == "approved")
    result = db.execute(stmt).one()
    # Standard annual entitlements (adjust as needed)
    casual_total, sick_total, earned_total = 12, 12, 15
    casual_used = result.casual_leave or 0
    sick_used = result.sick_leave or 0
    earned_used = result.earned_leave or 0
    return MessageResponse(
        message="Leave balance retrieved successfully",
        data={
            "casual": {
                "total": casual_total,
                "used": casual_used,
                "remaining": max(casual_total - casual_used, 0),
            },
            "sick": {
                "total": sick_total,
                "used": sick_used,
                "remaining": max(sick_total - sick_used, 0),
            },
            "earned": {
                "total": earned_total,
                "used": earned_used,
                "remaining": max(earned_total - earned_used, 0),
            },
        }
    )


# ── calendar ─────────────────────────────────────────────────────────────────


@router.get("/calendar", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def get_leave_calendar(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    from datetime import date

    start = date(year, month, 1)
    import calendar as cal

    last_day = cal.monthrange(year, month)[1]
    end = date(year, month, last_day)

    query = db.query(Leave).filter(
        Leave.start_date <= end,
        Leave.end_date >= start,
    )
    if not current_user.is_admin:
        query = query.filter(Leave.user_id == current_user.id)

    leaves = query.all()
    return MessageResponse(
        message="Leave calendar retrieved successfully",
        data=[
            {
                "id": str(lv.id),
                "user_id": str(lv.user_id),
                "type": lv.type,
                "start_date": str(lv.start_date),
                "end_date": str(lv.end_date),
                "status": lv.status,
            }
            for lv in leaves
        ]
    )


# ── team leaves (admin) ───────────────────────────────────────────────────────


@router.get("/team", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def get_team_leaves(
    status: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    q = db.query(Leave)
    if status:
        q = q.filter(Leave.status == status)
    return MessageResponse(
        message="Team leaves retrieved successfully",
        data=[LeaveOut.model_validate(_leave_to_out(lv, db)) for lv in q.all()]
    )


# ── approve ───────────────────────────────────────────────────────────────────


@router.put("/approve/{leave_id}", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def approve_leave(
    leave_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    leave_obj = db.query(Leave).filter(Leave.id == leave_id).first()
    if not leave_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave not found")
    if leave_obj.status not in ("pending",):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending leaves can be approved"
        )
    leave_obj.status = "approved"
    leave_obj.approved_by = current_user.id
    db.commit()
    db.refresh(leave_obj)
    return MessageResponse(
        message="Leave approved successfully",
        data=LeaveOut.model_validate(_leave_to_out(leave_obj, db))
    )


@router.put("/reject/{leave_id}", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def reject_leave(
    leave_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    leave_obj = db.query(Leave).filter(Leave.id == leave_id).first()
    if not leave_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave not found")
    if leave_obj.status not in ("pending",):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending leaves can be rejected"
        )
    leave_obj.status = "rejected"
    leave_obj.approved_by = current_user.id
    db.commit()
    db.refresh(leave_obj)
    return MessageResponse(
        message="Leave rejected successfully",
        data=LeaveOut.model_validate(_leave_to_out(leave_obj, db))
    )


@router.delete("/admin/{leave_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_leave(
    leave_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    leave_obj = db.query(Leave).filter(Leave.id == leave_id).first()
    if not leave_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave not found")
    db.delete(leave_obj)
    db.commit()
    return None


# ── update pending leave ──────────────────────────────────────────────────────


@router.put("/{leave_id}", status_code=status.HTTP_200_OK, response_model=LeaveOut)
def update_leave(
    leave_id: UUID,
    body: LeaveUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    leave_obj = (
        db.query(Leave)
        .filter(Leave.id == leave_id, Leave.user_id == current_user.id)
        .first()
    )
    if not leave_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave not found")
    if leave_obj.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending leaves can be updated"
        )
    for field, value in body.dict(exclude_unset=True).items():
        setattr(leave_obj, field, value)
    db.commit()
    db.refresh(leave_obj)
    return _leave_to_out(leave_obj, db)


# ── delete pending leave ──────────────────────────────────────────────────────


@router.delete("/{leave_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_leave(
    leave_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    leave_obj = (
        db.query(Leave)
        .filter(Leave.id == leave_id, Leave.user_id == current_user.id)
        .first()
    )
    if not leave_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave not found")
    if leave_obj.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Only pending leaves can be deleted"
        )
    db.delete(leave_obj)
    db.commit()
    return None


# ── cancellation ──────────────────────────────────────────────────────────────


@router.put("/cancel-request/{leave_id}", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def request_leave_cancellation(
    leave_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    leave_obj = (
        db.query(Leave)
        .filter(Leave.id == leave_id, Leave.user_id == current_user.id)
        .first()
    )
    if not leave_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave not found")
    now = datetime.now().date()
    current_time = datetime.now().time()
    if now > leave_obj.start_date or (
        now == leave_obj.start_date and current_time > time(6, 0)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancellation must be requested before 6:00 AM on the leave start date",
        )
    leave_obj.cancellation_requested = True
    db.commit()
    db.refresh(leave_obj)
    return MessageResponse(
        message="Cancellation request submitted successfully",
        data=LeaveOut.model_validate(_leave_to_out(leave_obj, db))
    )


@router.put("/cancel-approve/{leave_id}", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def approve_leave_cancellation(
    leave_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    leave_obj = db.query(Leave).filter(Leave.id == leave_id).first()
    if not leave_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave not found")
    if not leave_obj.cancellation_requested:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No cancellation request found")
    leave_obj.cancellation_approved = True
    leave_obj.status = "cancelled"
    db.commit()
    db.refresh(leave_obj)
    return MessageResponse(
        message="Cancellation approved successfully",
        data=LeaveOut.model_validate(_leave_to_out(leave_obj, db))
    )


# ── analytics (admin) ─────────────────────────────────────────────────────────


@router.get("/analytics", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def leave_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    users = db.query(User).all()
    analytics = []
    for user in users:
        leaves = db.query(Leave).filter(Leave.user_id == user.id).all()
        analytics.append(
            LeaveAnalyticsItem(
                user_id=str(user.id),
                employee_name=user.full_name or user.email,
                approved_leaves=sum(1 for lv in leaves if lv.status == "approved"),
                cancelled_leaves=sum(1 for lv in leaves if lv.status == "cancelled"),
                pending_leaves=sum(1 for lv in leaves if lv.status == "pending"),
                total_leaves=len(leaves),
                cancellation_requests=sum(
                    1 for lv in leaves if lv.cancellation_requested
                ),
            )
        )
    return MessageResponse(
        message="Analytics retrieved successfully",
        data=LeaveAnalyticsResponse(analytics=analytics)
    )
