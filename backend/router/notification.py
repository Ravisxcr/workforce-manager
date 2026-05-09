from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.session import get_db
from models.notification import Notification
from models.user import User
from schemas import MessageResponse
from schemas.notification import (
    NotificationBroadcast,
    NotificationOut,
    NotificationSend,
)
from services.auth import admin_required, get_current_active_user

router = APIRouter()


@router.get("/", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def get_my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    response = (
        db.query(Notification)
        .filter(Notification.employee_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return MessageResponse(
        message="Notifications retrieved successfully",
        data=[NotificationOut.model_validate(n) for n in response]
    )


@router.get("/unread-count", status_code=status.HTTP_200_OK, response_model=MessageResponse)
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
    return MessageResponse(
        message="Unread notifications count retrieved successfully",
        data={"unread": count}
    )


@router.patch("/{notification_id}/read", status_code=status.HTTP_200_OK, response_model=MessageResponse)
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
    return MessageResponse(
        message="Notification marked as read successfully",
        data=NotificationOut.model_validate(notif)
    )


@router.patch("/read-all", status_code=status.HTTP_204_NO_CONTENT)
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


@router.post("/send", status_code=status.HTTP_201_CREATED, response_model=MessageResponse)
def send_notification(
    body: NotificationSend,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    notif = Notification(**body.dict())
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return MessageResponse(
        message="Notification sent successfully",
        data=NotificationOut.model_validate(notif)
    )


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
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


@router.post("/broadcast", status_code=status.HTTP_201_CREATED, response_model=MessageResponse)
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

    return MessageResponse(
        message="Notifications broadcast successfully",
        data=[NotificationOut.model_validate(n) for n in notifications]
    )


@router.delete("/admin/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
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
