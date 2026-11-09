from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.models import NotificationModel
from backend.app.schemas.schemas import NotificationResponse, NotificationCreate

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_notifications(severity: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(NotificationModel)
    if severity and severity != "ALL":
        if severity == "UNREAD":
            query = query.filter(NotificationModel.read == False)
        else:
            query = query.filter(NotificationModel.severity == severity)
    return query.order_by(NotificationModel.created_at.desc()).all()


@router.put("/{notif_id}/read", response_model=NotificationResponse)
def mark_notification_read(notif_id: str, db: Session = Depends(get_db)):
    notif = db.query(NotificationModel).filter(NotificationModel.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    notif.read = True
    db.commit()
    db.refresh(notif)
    return notif


@router.put("/read-all")
def mark_all_notifications_read(db: Session = Depends(get_db)):
    db.query(NotificationModel).update({NotificationModel.read: True})
    db.commit()
    return {"message": "All notifications marked as read."}


@router.delete("")
def clear_all_notifications(db: Session = Depends(get_db)):
    db.query(NotificationModel).delete()
    db.commit()
    return {"message": "All notifications cleared."}

