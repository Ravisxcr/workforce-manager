import os
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from db.session import get_db
from models.claims import Reimbursement
from models.user import User
from schemas import MessageResponse
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


@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def create_reimbursement(
    reimbursement: ReimbursementCreate = Depends(),
    receipt: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    receipt_url = _save_receipt(receipt, current_user.id) if receipt else None
    db_reim = Reimbursement(
        **reimbursement.dict(), user_id=current_user.id, receipt_url=receipt_url
    )
    db.add(db_reim)
    db.commit()
    db.refresh(db_reim)
    return MessageResponse(
        message="Reimbursement created successfully",
        data=ReimbursementOut.model_validate(db_reim),
    )


@router.get("/", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def get_my_reimbursements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return MessageResponse(
        message="My reimbursements retrieved successfully",
        data=[
            ReimbursementOut.model_validate(reim)
            for reim in (
                db.query(Reimbursement)
                .filter(Reimbursement.user_id == current_user.id)
                .all()
            )
        ],
    )


@router.get("/all", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def list_all_reimbursements(
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    q = db.query(Reimbursement)
    if status:
        q = q.filter(Reimbursement.status == status)
    return MessageResponse(
        message="All reimbursements retrieved successfully",
        data=[
            ReimbursementOut.model_validate(reim)
            for reim in q.order_by(Reimbursement.date.desc()).all()
        ],
    )


@router.get(
    "/analytics", status_code=status.HTTP_200_OK, response_model=MessageResponse
)
def get_reimbursement_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    claims = db.query(Reimbursement).all()
    return MessageResponse(
        message="Reimbursement analytics retrieved successfully",
        data=ReimbursementAnalytics(
            total_claims=len(claims),
            total_approved=sum(1 for c in claims if c.status == "approved"),
            total_pending=sum(1 for c in claims if c.status == "pending"),
            total_rejected=sum(1 for c in claims if c.status == "rejected"),
            total_amount=str(sum(float(c.amount) for c in claims if c.amount)),
            claims=claims,
        ),
    )


@router.get(
    "/{reimbursement_id}",
    status_code=status.HTTP_200_OK,
    response_model=MessageResponse,
)
def get_reimbursement(
    reimbursement_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    reim = db.query(Reimbursement).filter(Reimbursement.id == reimbursement_id).first()
    if not reim:
        raise HTTPException(status_code=404, detail="Reimbursement not found")
    if reim.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return MessageResponse(
        message="Reimbursement retrieved successfully",
        data=ReimbursementOut.model_validate(reim),
    )


@router.put(
    "/{reimbursement_id}",
    status_code=status.HTTP_200_OK,
    response_model=MessageResponse,
)
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
            Reimbursement.user_id == current_user.id,
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
    return MessageResponse(
        message="Reimbursement updated successfully",
        data=ReimbursementOut.model_validate(reim),
    )


@router.delete("/{reimbursement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reimbursement(
    reimbursement_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    reim = (
        db.query(Reimbursement)
        .filter(
            Reimbursement.id == reimbursement_id,
            Reimbursement.user_id == current_user.id,
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


@router.post(
    "/approve/{reimbursement_id}",
    status_code=status.HTTP_200_OK,
    response_model=MessageResponse,
)
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
    return MessageResponse(
        message="Reimbursement approved successfully",
        data=ReimbursementOut.model_validate(reim),
    )
