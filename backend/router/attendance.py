from datetime import UTC, date, datetime
from uuid import UUID
import calendar as cal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from db.session import get_db
from models.attendance import Attendance
from models.user import User
from schemas.attendance import (
    AttendanceAnalytics,
    AttendanceCheckIn,
    AttendanceCheckOut,
    AttendanceManualEntry,
    AttendanceOut,
    AttendanceUpdate,
)
from schemas import MessageResponse
from schemas.auth import Role
from services.auth import admin_required, get_current_active_user

router = APIRouter()


def _calc_work_hours(
    check_in: datetime | None, check_out: datetime | None
) -> float | None:
    if check_in and check_out:
        delta = check_out - check_in
        return round(delta.total_seconds() / 3600, 2)
    return None


@router.post("/check-in", status_code=status.HTTP_201_CREATED, response_model=MessageResponse)
def check_in(
    body: AttendanceCheckIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    today = date.today()
    existing = (
        db.query(Attendance)
        .filter(
            Attendance.user_id == current_user.id,
            Attendance.date == today,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already checked in today")
    now = datetime.now(UTC).replace(tzinfo=None)
    record = Attendance(
        user_id=current_user.id,
        date=today,
        check_in=now,
        status="present",
        notes=body.notes,
        is_manual=False,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return MessageResponse(
        message="Checked in successfully",
        data=AttendanceOut.model_validate(record)
    )


@router.post("/check-out", status_code=status.HTTP_201_CREATED, response_model=MessageResponse)
def check_out(
    body: AttendanceCheckOut,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    today = date.today()
    record = (
        db.query(Attendance)
        .filter(
            Attendance.user_id == current_user.id,
            Attendance.date == today,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No check-in found for today")
    if record.check_out:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already checked out today")
    now = datetime.now(UTC).replace(tzinfo=None)
    record.check_out = now
    record.work_hours = _calc_work_hours(record.check_in, now)
    if body.notes:
        record.notes = body.notes
    db.commit()
    db.refresh(record)
    return MessageResponse(
        message="Checked out successfully",
        data=AttendanceOut.model_validate(record)
    )


@router.get("/me", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def get_my_attendance(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = db.query(Attendance).filter(Attendance.user_id == current_user.id)
    if month and year:
        import calendar as cal

        start = date(year, month, 1)
        end = date(year, month, cal.monthrange(year, month)[1])
        q = q.filter(Attendance.date >= start, Attendance.date <= end)
    response = q.order_by(Attendance.date.desc()).all()
    return MessageResponse(
        message="Attendance records retrieved successfully",
        data=[AttendanceOut.model_validate(record) for record in response]
    )




@router.get("/today", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def get_today_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    today = date.today()
    q = db.query(Attendance).filter(Attendance.date == today)
    if not current_user.role == Role.ADMIN.value:
        q = q.filter(Attendance.user_id == current_user.id)
    return MessageResponse(
        message="Today's attendance records retrieved successfully",
        data=[AttendanceOut.model_validate(record) for record in q.all()]
    )


@router.get("/monthly", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def get_monthly_attendance(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    user_id: UUID | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    import calendar as cal

    start = date(year, month, 1)
    end = date(year, month, cal.monthrange(year, month)[1])
    q = db.query(Attendance).filter(Attendance.date >= start, Attendance.date <= end)
    if not current_user.role == Role.ADMIN.value:
        q = q.filter(Attendance.user_id == current_user.id)
    elif user_id:
        q = q.filter(Attendance.user_id == user_id)
    return MessageResponse(
        message="Monthly attendance records retrieved successfully",
        data=[AttendanceOut.model_validate(record) for record in q.order_by(Attendance.date.asc()).all()]
    )


@router.get("/analytics", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def get_attendance_analytics(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    start = date(year, month, 1)
    end = date(year, month, cal.monthrange(year, month)[1])

    records = (
        db.query(Attendance)
        .filter(Attendance.date >= start, Attendance.date <= end)
        .all()
    )

    by_employee: dict = {}
    for r in records:
        eid = r.user_id
        by_employee.setdefault(eid, []).append(r)

    result = []
    for eid, emp_records in by_employee.items():
        user = db.query(User).filter(User.id == eid).first()
        work_hours = [r.work_hours for r in emp_records if r.work_hours]
        result.append(
            AttendanceAnalytics(
                user_id=eid,
                employee_name=user.full_name or user.email if user else eid,
                total_days=len(emp_records),
                present_days=sum(1 for r in emp_records if r.status == "present"),
                absent_days=sum(1 for r in emp_records if r.status == "absent"),
                late_days=sum(1 for r in emp_records if r.status == "late"),
                half_days=sum(1 for r in emp_records if r.status == "half-day"),
                avg_work_hours=round(sum(work_hours) / len(work_hours), 2)
                if work_hours
                else None,
            )
        )
    return MessageResponse(
        message="Attendance analytics retrieved successfully",
        data=result
    )

@router.post("/manual-entry", status_code=status.HTTP_201_CREATED, response_model=MessageResponse)
def manual_attendance_entry(
    body: AttendanceManualEntry,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    existing = (
        db.query(Attendance)
        .filter(
            Attendance.user_id == body.user_id,
            Attendance.date == body.date,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="Attendance already exists for this date"
        )
    record = Attendance(
        user_id=body.user_id,
        date=body.date,
        check_in=body.check_in,
        check_out=body.check_out,
        status=body.status,
        work_hours=_calc_work_hours(body.check_in, body.check_out),
        notes=body.notes,
        is_manual=True,
        marked_by_id=current_user.id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return MessageResponse(
        message="Attendance record created successfully",
        data=AttendanceOut.model_validate(record)
    )


@router.put("/{attendance_id}", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def update_attendance(
    attendance_id: UUID,
    body: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")
    for field, value in body.dict(exclude_unset=True).items():
        setattr(record, field, value)
    record.work_hours = _calc_work_hours(record.check_in, record.check_out)
    db.commit()
    db.refresh(record)
    return MessageResponse(
        message="Attendance record updated successfully",
        data=AttendanceOut.model_validate(record)
    )


@router.delete("/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attendance(
    attendance_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance record not found")
    db.delete(record)
    db.commit()
    return None


@router.get("/{user_id}", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def get_employee_attendance(
    user_id: UUID,
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    q = db.query(Attendance).filter(Attendance.user_id == user_id)
    if month and year:
        import calendar as cal

        start = date(year, month, 1)
        end = date(year, month, cal.monthrange(year, month)[1])
        q = q.filter(Attendance.date >= start, Attendance.date <= end)
    return MessageResponse(
        message="Attendance records retrieved successfully",
        data=[AttendanceOut.model_validate(record) for record in q.order_by(Attendance.date.desc()).all()]
    )
