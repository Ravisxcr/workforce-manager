import os
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from db.session import get_db
from models.claims import Reimbursement
from models.user import User
from schemas.reimbursement import (ReimbursementAnalytics, ReimbursementCreate,
                                   ReimbursementOut, ReimbursementUpdateStatus)
from services.auth import get_current_active_user, admin_required

router = APIRouter()



@router.post("/", response_model=ReimbursementOut)
def create_reimbursement(
    reimbursement: ReimbursementCreate = Depends(),
    receipt: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    receipt_url = None
    if receipt:
        ext = os.path.splitext(receipt.filename)[1].lower()
        if ext not in [".pdf", ".png", ".jpg", ".jpeg"]:
            raise HTTPException(status_code=400, detail="Invalid receipt file type")
        upload_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        receipt_url = os.path.join(upload_dir, f"{current_user.id}_{receipt.filename}")
        with open(receipt_url, "wb") as f:
            f.write(receipt.file.read())
    db_reim = Reimbursement(**reimbursement.dict(), employee_id=current_user.id, receipt_url=receipt_url)
    db.add(db_reim)
    db.commit()
    db.refresh(db_reim)
    return db_reim


@router.get("/", response_model=List[ReimbursementOut])
def get_my_reimbursements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return (
        db.query(Reimbursement)
        .filter(Reimbursement.employee_id == current_user.id)
        .all()
    )


@router.post("/approve/{reimbursement_id}", response_model=ReimbursementOut)
def approve_reimbursement(
    reimbursement_id: UUID,
    update: ReimbursementUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    reim = db.query(Reimbursement).filter(Reimbursement.id == reimbursement_id).first()
    if not reim:
        raise HTTPException(status_code=404, detail="Reimbursement not found")
    reim.status = update.status
    reim.approved_by_id = current_user.id
    db.commit()
    db.refresh(reim)
    return reim



@router.get("/analytics", response_model=ReimbursementAnalytics)
def get_reimbursement_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    claims = db.query(Reimbursement).all()
    total_claims = len(claims)
    total_approved = len([c for c in claims if c.status == "approved"])
    total_pending = len([c for c in claims if c.status == "pending"])
    total_rejected = len([c for c in claims if c.status == "rejected"])
    total_amount = str(sum(float(c.amount) for c in claims if c.amount))
    return ReimbursementAnalytics(
        total_claims=total_claims,
        total_approved=total_approved,
        total_pending=total_pending,
        total_rejected=total_rejected,
        total_amount=total_amount,
        claims=claims,
    )
