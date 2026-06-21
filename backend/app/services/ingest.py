"""Document ingestion: clean -> chunk -> embed -> store."""
from sqlalchemy.orm import Session

from ..config import settings
from ..models import Document, Chunk
from .embeddings import embed_texts


def chunk_text(text: str, size: int | None = None, overlap: int | None = None) -> list[str]:
    """Simple word-aware sliding-window chunker."""
    size = size or settings.chunk_size
    overlap = overlap or settings.chunk_overlap
    text = " ".join(text.split())  # normalise whitespace
    if not text:
        return []

    chunks: list[str] = []
    start = 0
    n = len(text)
    while start < n:
        end = min(start + size, n)
        # try to break on a space near the end for cleaner chunks
        if end < n:
            space = text.rfind(" ", start, end)
            if space > start:
                end = space
        chunks.append(text[start:end].strip())
        if end >= n:
            break
        start = max(end - overlap, start + 1)
    return [c for c in chunks if c]


def ingest_document(db: Session, tenant_id: str, title: str, content: str, source: str = "text") -> Document:
    doc = Document(tenant_id=tenant_id, title=title, source=source, status="processing")
    db.add(doc)
    db.flush()  # get doc.id

    pieces = chunk_text(content)
    if pieces:
        vectors = embed_texts(pieces)
        for i, (piece, vec) in enumerate(zip(pieces, vectors)):
            db.add(
                Chunk(
                    tenant_id=tenant_id,
                    document_id=doc.id,
                    content=piece,
                    chunk_index=i,
                    embedding=vec,
                )
            )

    doc.chunk_count = len(pieces)
    doc.status = "ready"
    db.commit()
    db.refresh(doc)
    return doc
