from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.session import get_db
from models.notification import Notification
from models.user import User
from schemas.notification import (
    NotificationBroadcast,
    NotificationOut,
    NotificationSend,
)
from services.auth import admin_required, get_current_active_user

router = APIRouter()


@router.get("/", response_model=list[NotificationOut])
def get_my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return (
        db.query(Notification)
        .filter(Notification.employee_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    count = (
        db.query(Notification)
        .filter(
            Notification.employee_id == current_user.id, Notification.is_read.is_(False)
        )
        .count()
    )
    return {"unread": count}


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_as_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    notif = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.employee_id == current_user.id,
        )
        .first()
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


@router.patch("/read-all", status_code=204)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    db.query(Notification).filter(
        Notification.employee_id == current_user.id,
        Notification.is_read.is_(False),
    ).update({"is_read": True})
    db.commit()
    return None


@router.post("/send", response_model=NotificationOut)
def send_notification(
    body: NotificationSend,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    notif = Notification(**body.dict())
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


@router.delete("/{notification_id}", status_code=204)
def delete_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    notif = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.employee_id == current_user.id,
        )
        .first()
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(notif)
    db.commit()
    return None


@router.post("/broadcast", response_model=list[NotificationOut])
def broadcast_notification(
    body: NotificationBroadcast,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    notifications = []
    for employee_id in body.employee_ids:
        notif = Notification(
            employee_id=employee_id,
            title=body.title,
            message=body.message,
            type=body.type,
            link=body.link,
        )
        db.add(notif)
        notifications.append(notif)
    db.commit()
    for n in notifications:
        db.refresh(n)
    return notifications


@router.delete("/admin/{notification_id}", status_code=204)
def admin_delete_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(notif)
    db.commit()
    return None
