import os
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from db.session import get_db
from models.user import Document, User
from schemas.document import DocumentOut, DocumentVerify
from services.auth import admin_required, get_current_active_user

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
router = APIRouter()


@router.post("/upload", response_model=DocumentOut)
def upload_document(
    document_type: str = File(...),
    description: str = File(None),
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
        employee_id=current_user.id,
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
                detail="Document of this type already uploaded for this employee.",
            )
        raise
    return doc


@router.patch("/{document_id}/verify", response_model=DocumentOut)
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
    doc.verified_at = verify.verified_at or None
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/my", response_model=list[DocumentOut])
def get_my_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return db.query(Document).filter(Document.employee_id == current_user.id).all()


@router.get("/{document_id}/file")
def get_document_file(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.employee_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=403, detail="Not authorized to access this file"
        )
    file_path = doc.file_path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    ext = os.path.splitext(file_path)[1].lower()
    media_type = "application/pdf" if ext == ".pdf" else "image/png"
    from fastapi.responses import FileResponse

    return FileResponse(
        file_path, media_type=media_type, filename=os.path.basename(file_path)
    )
