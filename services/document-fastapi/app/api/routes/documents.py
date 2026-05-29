from uuid import UUID, uuid4
from enum import Enum
import requests

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
)

from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.document import Document
from app.models.compliance_check import ComplianceCheck

from app.schemas.document import (
    DocumentResponse,
    DocumentListResponse,
)

from app.services.minio_service import upload_file_to_minio
from app.services.mongo_service import save_processing_log


router = APIRouter(tags=["Documents"])


FLASK_GATEWAY_URL = "http://flask-gateway:8001/api/v1/compliance/check"

BFF_WEBHOOK_URL = (
    "http://express-bff:4000/api/v1/webhooks/processing-complete"
)


class DocumentType(str, Enum):
    financial_report = "financial_report"
    tax_filing = "tax_filing"
    regulatory_disclosure = "regulatory_disclosure"


@router.post("/upload", response_model=DocumentResponse)
def upload_document(
    file: UploadFile = File(...),
    document_type: DocumentType = Form(...),
    db: Session = Depends(get_db),
):
    try:
        file_bytes = file.file.read()

        storage_path = f"{uuid4()}_{file.filename}"

        document = Document(
            user_id="00000000-0000-0000-0000-000000000001",
            filename=storage_path,
            original_name=file.filename,
            document_type=document_type.value,
            file_size=len(file_bytes),
            mime_type=file.content_type or "application/octet-stream",
            storage_path=storage_path,
            minio_key=storage_path,
            status="UPLOADED",
        )

        # 1. Subir archivo primero
        upload_file_to_minio(
            bucket_name="documents",
            object_name=storage_path,
            data=file_bytes,
            content_type=file.content_type,
        )

        # 2. Guardar en DB
        db.add(document)
        db.commit()
        db.refresh(document)

        return document

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}",
        )


@router.get("/", response_model=DocumentListResponse)
def list_documents(
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    offset = (page - 1) * limit

    total = db.query(Document).count()

    items = (
        db.query(Document)
        .order_by(Document.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "items": items,
    }


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: UUID,
    db: Session = Depends(get_db),
):
    document = (
        db.query(Document)
        .filter(Document.id == document_id)
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    return document


@router.post("/{document_id}/process")
def process_document(
    document_id: UUID,
    db: Session = Depends(get_db),
):
    document = (
        db.query(Document)
        .filter(Document.id == document_id)
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    document.status = "PROCESSING"
    db.commit()

    doc_id_str = str(document.id)

    payload = {
        "document_id": doc_id_str,
        "filename": document.filename,
        "document_type": document.document_type,
        "storage_path": document.storage_path,
    }

    try:
        flask_resp = requests.post(
            FLASK_GATEWAY_URL,
            json=payload,
            timeout=30,
        )

    except requests.exceptions.ConnectionError as e:
        document.status = "FAILED"
        db.commit()

        raise HTTPException(
            status_code=502,
            detail=f"Flask gateway connection error: {str(e)}",
        )

    if flask_resp.status_code != 200:
        document.status = "FAILED"
        db.commit()

        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {flask_resp.text}",
        )

    processing_result = flask_resp.json()

    compliance = ComplianceCheck(
        document_id=document.id,
        status=processing_result.get("status", "UNKNOWN"),
        details=processing_result.get("details", ""),
    )

    db.add(compliance)

    document.status = "PROCESSED"

    db.commit()
    db.refresh(document)

    # Webhook al BFF para notificaciones
    try:
        requests.post(
            BFF_WEBHOOK_URL,
            json={
                "document_id": doc_id_str,
                "filename": document.filename,
                "document_status": document.status,
                "compliance_status": processing_result.get("status", "UNKNOWN"),
                "details": processing_result.get("details", ""),
            },
            timeout=5,
        )
    except Exception as e:
        print("Webhook error:", str(e))

    # Log MongoDB
    try:
        save_processing_log({
            "document_id": doc_id_str,
            "filename": document.filename,
            "status": document.status,
            "processing_result": processing_result,
        })

    except Exception as e:
        print("MongoDB log error:", str(e))

    return {
        "message": "Document processed successfully",
        "document_id": doc_id_str,
        "status": document.status,
        "result": processing_result,
    }
