"""Vector retrieval over a tenant's chunks using pgvector cosine distance."""
from sqlalchemy.orm import Session

from ..config import settings
from ..models import Chunk, Document
from .embeddings import embed_query


def retrieve(db: Session, tenant_id: str, query: str, top_k: int | None = None):
    """Return list of (Chunk, document_title, score) ranked by similarity."""
    top_k = top_k or settings.retrieval_top_k
    q_vec = embed_query(query)

    distance = Chunk.embedding.cosine_distance(q_vec).label("distance")
    rows = (
        db.query(Chunk, Document.title, distance)
        .join(Document, Document.id == Chunk.document_id)
        .filter(Chunk.tenant_id == tenant_id)
        .order_by(distance)
        .limit(top_k)
        .all()
    )
    # cosine similarity = 1 - cosine distance
    return [(chunk, title, 1.0 - float(dist)) for chunk, title, dist in rows]


def build_context(results) -> str:
    parts = []
    for i, (chunk, title, _score) in enumerate(results, 1):
        parts.append(f"[Source {i} - {title}]\n{chunk.content}")
    return "\n\n".join(parts)
