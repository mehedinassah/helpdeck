from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_tenant
from ..models import Tenant, Document
from ..schemas import DocumentCreate, DocumentOut
from ..services.ingest import ingest_document

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.get("", response_model=list[DocumentOut])
def list_documents(tenant: Tenant = Depends(get_current_tenant), db: Session = Depends(get_db)):
    return (
        db.query(Document)
        .filter(Document.tenant_id == tenant.id)
        .order_by(Document.created_at.desc())
        .all()
    )


@router.post("", response_model=DocumentOut)
def add_text_document(
    payload: DocumentCreate,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Add a document from raw text (FAQ, policy, article, ...)."""
    return ingest_document(db, tenant.id, payload.title, payload.content, source="text")


@router.post("/upload", response_model=DocumentOut)
def upload_document(
    file: UploadFile = File(...),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """Upload a .txt, .md, or .pdf file."""
    name = (file.filename or "document").lower()
    raw = file.file.read()

    if name.endswith(".pdf"):
        import io
        from pypdf import PdfReader

        try:
            reader = PdfReader(io.BytesIO(raw))
            text = "\n".join((page.extract_text() or "") for page in reader.pages)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=400, detail=f"Could not read PDF: {exc}")
    else:
        try:
            text = raw.decode("utf-8", errors="ignore")
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=400, detail=f"Could not read file: {exc}")

    if not text.strip():
        raise HTTPException(status_code=400, detail="No extractable text found in file")

    source = "pdf" if name.endswith(".pdf") else "text"
    return ingest_document(db, tenant.id, file.filename or "document", text, source=source)


@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    doc = (
        db.query(Document)
        .filter(Document.id == document_id, Document.tenant_id == tenant.id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(doc)
    db.commit()
    return {"deleted": document_id}
