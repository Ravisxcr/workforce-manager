import uuid
from datetime import datetime, time

from fastapi import APIRouter, Depends, HTTPException
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
)
from services.auth import admin_required, get_current_active_user

router = APIRouter()


@router.post("/", response_model=LeaveOut)
def create_leave(
    leave: LeaveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    leave_obj = Leave(**leave.dict())
    leave_obj.employee_id = current_user.id
    leave_obj.status = "pending"
    db.add(leave_obj)
    db.commit()
    db.refresh(leave_obj)
    # Convert UUID fields to str for response
    result = leave_obj.__dict__.copy()
    if hasattr(leave_obj, "id") and isinstance(leave_obj.id, (str, bytes)) is False:
        result["id"] = str(leave_obj.id)
    if (
        hasattr(leave_obj, "employee_id")
        and isinstance(leave_obj.employee_id, (str, bytes)) is False
    ):
        result["employee_id"] = str(leave_obj.employee_id)
    return LeaveOut(**result)


@router.get("/", response_model=LeaveListResponse)
def get_leaves(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    leaves = db.query(Leave).filter(Leave.employee_id == current_user.id).all()

    # Calculate days in SQL using julianday for SQLite
    days_expr = func.julianday(Leave.end_date) - func.julianday(Leave.start_date) + 1
    stmt = select(
        func.sum(case((Leave.type == "casual", days_expr), else_=0)).label(
            "casual_leave"
        ),
        func.sum(case((Leave.type == "sick", days_expr), else_=0)).label("sick_leave"),
        func.sum(case((Leave.type == "earned", days_expr), else_=0)).label(
            "earned_leave"
        ),
        func.sum(case((Leave.status == "pending", days_expr), else_=0)).label(
            "requested_leave"
        ),
    ).where(Leave.employee_id == current_user.id)

    result = db.execute(stmt).first()

    data = []
    for leave_obj in leaves:
        item = leave_obj.__dict__.copy()
        if hasattr(leave_obj, "id") and isinstance(leave_obj.id, (str, bytes)) is False:
            item["id"] = str(leave_obj.id)
        if (
            hasattr(leave_obj, "employee_id")
            and isinstance(leave_obj.employee_id, (str, bytes)) is False
        ):
            item["employee_id"] = str(leave_obj.employee_id)
        approver_name = None
        if getattr(leave_obj, "approved_by_admin", None):
            approver = (
                db.query(User).filter(User.id == leave_obj.approved_by_admin).first()
            )
            if approver:
                approver_name = approver.full_name or approver.email
        item["approved_by"] = approver_name
        item["days"] = (leave_obj.end_date - leave_obj.start_date).days + 1
        data.append(LeaveOut(**item))
    return {
        "data": data,
        "extra": {
            "casual_leave": result.casual_leave or 0,
            "sick_leave": result.sick_leave or 0,
            "earned_leave": result.earned_leave or 0,
            "requested_leave": result.requested_leave or 0,
        },
    }


@router.put("/approve/{leave_id}", response_model=LeaveOut)
def approve_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    leave_obj = db.query(Leave).filter(Leave.id == leave_id).first()
    if leave_obj:
        leave_obj.status = "approved"
        leave_obj.approved_by_admin = current_user.id
        db.commit()
        db.refresh(leave_obj)
        result = leave_obj.__dict__.copy()
        if hasattr(leave_obj, "id") and isinstance(leave_obj.id, (str, bytes)) is False:
            result["id"] = str(leave_obj.id)
        if (
            hasattr(leave_obj, "employee_id")
            and isinstance(leave_obj.employee_id, (str, bytes)) is False
        ):
            result["employee_id"] = str(leave_obj.employee_id)
        return LeaveOut(**result)
    return None


# Raise cancellation request for approved leave before leave begins (before 6:00 am)
@router.put("/cancel-request/{leave_id}", response_model=LeaveOut)
def request_leave_cancellation(
    leave_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        leave_uuid = uuid.UUID(leave_id)
        leave_obj = (
            db.query(Leave)
            .filter(Leave.id == leave_uuid, Leave.employee_id == current_user.id)
            .first()
        )
        now = datetime.now().date()
        current_time = datetime.now().time()
        if not leave_obj:
            raise HTTPException(status_code=404, detail="Leave not found")
        if now > leave_obj.start_date or (
            now == leave_obj.start_date and current_time > time(6, 0)
        ):
            raise HTTPException(
                status_code=400,
                detail=f"Cancellation request must be before 6:00 am on leave start date. Now: {now} {current_time}, Start: {leave_obj.start_date}",
            )
        leave_obj.cancellation_requested = True
        db.commit()
        db.refresh(leave_obj)
        return leave_obj
    except Exception as e:
        print(f"Error in cancellation request: {e}")
        raise HTTPException(status_code=400, detail=str(e))


# Approve cancellation of leave
@router.put("/cancel-approve/{leave_id}", response_model=LeaveOut)
def approve_leave_cancellation(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    leave_obj = db.query(Leave).filter(Leave.id == leave_id).first()
    if not leave_obj:
        raise HTTPException(status_code=404, detail="Leave not found")
    if not leave_obj.cancellation_requested:
        raise HTTPException(status_code=400, detail="No cancellation request found")
    leave_obj.cancellation_approved = True
    leave_obj.status = "cancelled"
    db.commit()
    db.refresh(leave_obj)
    return leave_obj


# Admin analytics endpoint for all leaves, grouped by employee
@router.get("/leave/analytics", response_model=LeaveAnalyticsResponse)
def leave_analytics(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
):
    users = db.query(User).all()
    analytics = []
    for user in users:
        leaves = db.query(Leave).filter(Leave.employee_id == user.id).all()
        approved = sum(1 for leave in leaves if leave.status == "approved")
        cancelled = sum(1 for leave in leaves if leave.status == "cancelled")
        pending = sum(1 for leave in leaves if leave.status == "pending")
        cancellation_requests = sum(
            1 for leave in leaves if leave.cancellation_requested
        )
        total = len(leaves)
        analytics.append(
            LeaveAnalyticsItem(
                employee_id=user.id,
                employee_name=user.username,
                approved_leaves=approved,
                cancelled_leaves=cancelled,
                pending_leaves=pending,
                total_leaves=total,
                cancellation_requests=cancellation_requests,
            )
        )
    return LeaveAnalyticsResponse(analytics=analytics)
