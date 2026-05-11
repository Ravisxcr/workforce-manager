import os
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from db.session import get_db
from models.user import Document, User
from schemas import MessageResponse
from schemas.document import DocumentOut, DocumentVerify
from services.auth import admin_required, get_current_active_user

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
router = APIRouter()

DOCUMENT_TYPES = [
    "pan_card",
    "aadhaar_card",
    "passport",
    "driving_license",
    "offer_letter",
    "relieving_letter",
    "education_certificate",
    "experience_letter",
    "bank_passbook",
    "other",
]


@router.get("/types", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def get_document_types():
    return MessageResponse(
        message="Document types retrieved successfully", data={"types": DOCUMENT_TYPES}
    )


@router.post(
    "/upload", status_code=status.HTTP_201_CREATED, response_model=MessageResponse
)
def upload_document(
    document_type: str = File(...),
    description: str | None = File(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".png", ".jpg", ".jpeg"]:
        raise HTTPException(status_code=400, detail="Invalid file type")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, f"{current_user.id}_{file.filename}")
    with open(file_path, "wb") as f:
        f.write(file.file.read())
    doc = Document(
        user_id=current_user.id,
        document_type=document_type,
        description=description,
        file_path=file_path,
        status="pending",
    )
    try:
        db.add(doc)
        db.commit()
        db.refresh(doc)
    except Exception as e:
        db.rollback()
        if "uq_employee_document_type" in str(e):
            raise HTTPException(
                status_code=400,
                detail="Document of this type already uploaded. Delete existing one first.",
            ) from e
        raise
    return MessageResponse(
        message="Document uploaded successfully", data=DocumentOut.model_validate(doc)
    )


@router.get("/my", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def get_my_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    documents = db.query(Document).filter(Document.user_id == current_user.id).all()
    return MessageResponse(
        message="Documents retrieved successfully",
        data=[DocumentOut.model_validate(doc) for doc in documents],
    )


@router.get("/pending", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def get_pending_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    documents = db.query(Document).filter(Document.status == "pending").all()
    return MessageResponse(
        message="Pending documents retrieved successfully",
        data=[DocumentOut.model_validate(doc) for doc in documents],
    )


@router.get("/all", status_code=status.HTTP_200_OK, response_model=MessageResponse)
def get_all_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    documents = db.query(Document).all()
    return MessageResponse(
        message="All documents retrieved successfully",
        data=[DocumentOut.model_validate(doc) for doc in documents],
    )


@router.patch(
    "/{document_id}/verify",
    status_code=status.HTTP_200_OK,
    response_model=MessageResponse,
)
def verify_document(
    document_id: UUID,
    verify: DocumentVerify,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.status = verify.status
    doc.comment = verify.comment
    doc.verified_by_id = current_user.id
    doc.verified_at = datetime.now()
    db.commit()
    db.refresh(doc)
    return MessageResponse(
        message="Document verified successfully", data=DocumentOut.model_validate(doc)
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    db.delete(doc)
    db.commit()
    return None


@router.get("/{document_id}/file", status_code=status.HTTP_200_OK)
def get_document_file(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=403, detail="Not authorized to access this file"
        )
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    ext = os.path.splitext(doc.file_path)[1].lower()
    media_type = "application/pdf" if ext == ".pdf" else "image/png"
    return FileResponse(
        path=doc.file_path,
        media_type=media_type,
        filename=os.path.basename(doc.file_path),
    )
