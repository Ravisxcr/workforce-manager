from datetime import UTC, date, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
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
from services.auth import admin_required, get_current_active_user

router = APIRouter()


def _calc_work_hours(
    check_in: datetime | None, check_out: datetime | None
) -> float | None:
    if check_in and check_out:
        delta = check_out - check_in
        return round(delta.total_seconds() / 3600, 2)
    return None


@router.post("/check-in", response_model=AttendanceOut)
def check_in(
    body: AttendanceCheckIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    today = date.today()
    existing = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == current_user.id,
            Attendance.date == today,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already checked in today")
    now = datetime.now(UTC).replace(tzinfo=None)
    record = Attendance(
        employee_id=current_user.id,
        date=today,
        check_in=now,
        status="present",
        notes=body.notes,
        is_manual=False,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.post("/check-out", response_model=AttendanceOut)
def check_out(
    body: AttendanceCheckOut,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    today = date.today()
    record = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == current_user.id,
            Attendance.date == today,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="No check-in found for today")
    if record.check_out:
        raise HTTPException(status_code=400, detail="Already checked out today")
    now = datetime.now(UTC).replace(tzinfo=None)
    record.check_out = now
    record.work_hours = _calc_work_hours(record.check_in, now)
    if body.notes:
        record.notes = body.notes
    db.commit()
    db.refresh(record)
    return record


@router.get("/me", response_model=list[AttendanceOut])
def get_my_attendance(
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    q = db.query(Attendance).filter(Attendance.employee_id == current_user.id)
    if month and year:
        import calendar as cal

        start = date(year, month, 1)
        end = date(year, month, cal.monthrange(year, month)[1])
        q = q.filter(Attendance.date >= start, Attendance.date <= end)
    return q.order_by(Attendance.date.desc()).all()


@router.get("/today", response_model=list[AttendanceOut])
def get_today_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    today = date.today()
    q = db.query(Attendance).filter(Attendance.date == today)
    if not current_user.is_admin:
        q = q.filter(Attendance.employee_id == current_user.id)
    return q.all()


@router.get("/monthly", response_model=list[AttendanceOut])
def get_monthly_attendance(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    employee_id: UUID | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    import calendar as cal

    start = date(year, month, 1)
    end = date(year, month, cal.monthrange(year, month)[1])
    q = db.query(Attendance).filter(Attendance.date >= start, Attendance.date <= end)
    if not current_user.is_admin:
        q = q.filter(Attendance.employee_id == current_user.id)
    elif employee_id:
        q = q.filter(Attendance.employee_id == employee_id)
    return q.order_by(Attendance.date.asc()).all()


@router.get("/analytics", response_model=list[AttendanceAnalytics])
def get_attendance_analytics(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    import calendar as cal

    start = date(year, month, 1)
    end = date(year, month, cal.monthrange(year, month)[1])

    records = (
        db.query(Attendance)
        .filter(Attendance.date >= start, Attendance.date <= end)
        .all()
    )

    by_employee: dict = {}
    for r in records:
        eid = str(r.employee_id)
        by_employee.setdefault(eid, []).append(r)

    result = []
    for eid, emp_records in by_employee.items():
        user = db.query(User).filter(User.id == eid).first()
        work_hours = [r.work_hours for r in emp_records if r.work_hours]
        result.append(
            AttendanceAnalytics(
                employee_id=eid,
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
    return result


@router.post("/manual-entry", response_model=AttendanceOut)
def manual_attendance_entry(
    body: AttendanceManualEntry,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    existing = (
        db.query(Attendance)
        .filter(
            Attendance.employee_id == body.employee_id,
            Attendance.date == body.date,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="Attendance already exists for this date"
        )
    record = Attendance(
        employee_id=body.employee_id,
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
    return record


@router.put("/{attendance_id}", response_model=AttendanceOut)
def update_attendance(
    attendance_id: UUID,
    body: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    for field, value in body.dict(exclude_unset=True).items():
        setattr(record, field, value)
    record.work_hours = _calc_work_hours(record.check_in, record.check_out)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{attendance_id}", status_code=204)
def delete_attendance(
    attendance_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    db.delete(record)
    db.commit()
    return None


@router.get("/{employee_id}", response_model=list[AttendanceOut])
def get_employee_attendance(
    employee_id: UUID,
    month: int | None = Query(None, ge=1, le=12),
    year: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    q = db.query(Attendance).filter(Attendance.employee_id == employee_id)
    if month and year:
        import calendar as cal

        start = date(year, month, 1)
        end = date(year, month, cal.monthrange(year, month)[1])
        q = q.filter(Attendance.date >= start, Attendance.date <= end)
    return q.order_by(Attendance.date.desc()).all()
