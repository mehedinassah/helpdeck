import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..database import SessionLocal, get_db
from ..deps import get_current_tenant
from ..models import Tenant, Message
from ..schemas import ChatRequest
from ..services.retrieval import retrieve, build_context
from ..services.llm import build_messages, stream_chat

router = APIRouter(prefix="/api", tags=["chat"])


def _check_quota(db: Session, tenant: Tenant) -> None:
    used = (
        db.query(Message)
        .filter(Message.tenant_id == tenant.id, Message.role == "user")
        .count()
    )
    if used >= tenant.message_limit:
        raise HTTPException(status_code=429, detail="Message limit reached for current plan")


@router.post("/chat")
def chat(
    payload: ChatRequest,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """RAG chat with Server-Sent-Events streaming.

    Emits events:
      - {"type": "sources", "sources": [...]}
      - {"type": "token", "text": "..."}
      - {"type": "done", "conversation_id": "..."}
    """
    _check_quota(db, tenant)

    question = payload.message.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Empty message")

    conversation_id = payload.conversation_id or str(uuid.uuid4())
    tenant_id = tenant.id

    # Retrieve context before streaming starts.
    results = retrieve(db, tenant_id, question)
    context = build_context(results) if results else "No relevant information found."
    sources = [
        {
            "document_id": chunk.document_id,
            "title": title,
            "snippet": chunk.content[:200],
            "score": round(score, 4),
        }
        for chunk, title, score in results
    ]
    messages = build_messages(question, context)

    # Log the user message immediately (counts toward usage).
    db.add(Message(tenant_id=tenant_id, conversation_id=conversation_id, role="user", content=question))
    db.commit()

    def event_stream():
        yield _sse({"type": "sources", "sources": sources})
        answer_parts: list[str] = []
        try:
            for token in stream_chat(messages):
                answer_parts.append(token)
                yield _sse({"type": "token", "text": token})
        except Exception as exc:  # noqa: BLE001
            yield _sse({"type": "error", "message": str(exc)})

        # Persist assistant answer in a fresh session (generator runs after request scope).
        answer = "".join(answer_parts)
        if answer:
            log_db = SessionLocal()
            try:
                log_db.add(
                    Message(
                        tenant_id=tenant_id,
                        conversation_id=conversation_id,
                        role="assistant",
                        content=answer,
                    )
                )
                log_db.commit()
            finally:
                log_db.close()

        yield _sse({"type": "done", "conversation_id": conversation_id})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"
