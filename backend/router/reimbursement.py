import os
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from db.session import get_db
from models.claims import Reimbursement
from models.user import User
from schemas.reimbursement import (
    ReimbursementAnalytics,
    ReimbursementCreate,
    ReimbursementOut,
    ReimbursementUpdate,
    ReimbursementUpdateStatus,
)
from services.auth import admin_required, get_current_active_user

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")


def _save_receipt(receipt: UploadFile, user_id) -> str:
    ext = os.path.splitext(receipt.filename)[1].lower()
    if ext not in [".pdf", ".png", ".jpg", ".jpeg"]:
        raise HTTPException(status_code=400, detail="Invalid receipt file type")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    path = os.path.join(UPLOAD_DIR, f"{user_id}_{receipt.filename}")
    with open(path, "wb") as f:
        f.write(receipt.file.read())
    return path


@router.post("/", response_model=ReimbursementOut)
def create_reimbursement(
    reimbursement: ReimbursementCreate = Depends(),
    receipt: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    receipt_url = _save_receipt(receipt, current_user.id) if receipt else None
    db_reim = Reimbursement(
        **reimbursement.dict(), employee_id=current_user.id, receipt_url=receipt_url
    )
    db.add(db_reim)
    db.commit()
    db.refresh(db_reim)
    return db_reim


@router.get("/", response_model=list[ReimbursementOut])
def get_my_reimbursements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return (
        db.query(Reimbursement)
        .filter(Reimbursement.employee_id == current_user.id)
        .all()
    )


@router.get("/all", response_model=list[ReimbursementOut])
def list_all_reimbursements(
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    q = db.query(Reimbursement)
    if status:
        q = q.filter(Reimbursement.status == status)
    return q.order_by(Reimbursement.date.desc()).all()


@router.get("/analytics", response_model=ReimbursementAnalytics)
def get_reimbursement_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    claims = db.query(Reimbursement).all()
    return ReimbursementAnalytics(
        total_claims=len(claims),
        total_approved=sum(1 for c in claims if c.status == "approved"),
        total_pending=sum(1 for c in claims if c.status == "pending"),
        total_rejected=sum(1 for c in claims if c.status == "rejected"),
        total_amount=str(sum(float(c.amount) for c in claims if c.amount)),
        claims=claims,
    )


@router.get("/{reimbursement_id}", response_model=ReimbursementOut)
def get_reimbursement(
    reimbursement_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    reim = db.query(Reimbursement).filter(Reimbursement.id == reimbursement_id).first()
    if not reim:
        raise HTTPException(status_code=404, detail="Reimbursement not found")
    if reim.employee_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return reim


@router.put("/{reimbursement_id}", response_model=ReimbursementOut)
def update_reimbursement(
    reimbursement_id: UUID,
    body: ReimbursementUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    reim = (
        db.query(Reimbursement)
        .filter(
            Reimbursement.id == reimbursement_id,
            Reimbursement.employee_id == current_user.id,
        )
        .first()
    )
    if not reim:
        raise HTTPException(status_code=404, detail="Reimbursement not found")
    if reim.status != "pending":
        raise HTTPException(
            status_code=400, detail="Only pending claims can be updated"
        )
    for field, value in body.dict(exclude_unset=True).items():
        setattr(reim, field, value)
    db.commit()
    db.refresh(reim)
    return reim


@router.delete("/{reimbursement_id}", status_code=204)
def delete_reimbursement(
    reimbursement_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    reim = (
        db.query(Reimbursement)
        .filter(
            Reimbursement.id == reimbursement_id,
            Reimbursement.employee_id == current_user.id,
        )
        .first()
    )
    if not reim:
        raise HTTPException(status_code=404, detail="Reimbursement not found")
    if reim.status != "pending":
        raise HTTPException(
            status_code=400, detail="Only pending claims can be deleted"
        )
    db.delete(reim)
    db.commit()
    return None


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
    if update.remarks:
        reim.remarks = update.remarks
    if update.date_approved:
        reim.date_approved = update.date_approved
    db.commit()
    db.refresh(reim)
    return reim
