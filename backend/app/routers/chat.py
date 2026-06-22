import json
import uuid
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..config import settings
from ..database import SessionLocal, get_db
from ..deps import get_tenant_for_chat
from ..models import Tenant, Message
from ..schemas import ChatRequest
from ..services.retrieval import retrieve, build_context
from ..services.llm import build_messages, stream_chat
from ..services import ratelimit

router = APIRouter(prefix="/api", tags=["chat"])


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _check_domain(tenant: Tenant, request: Request) -> None:
    """If the tenant set an allowlist, the request's Origin/Referer host must match."""
    if not tenant.allowed_domains:
        return
    allowed = {d.strip().lower() for d in tenant.allowed_domains.split(",") if d.strip()}
    if not allowed:
        return
    origin = request.headers.get("origin") or request.headers.get("referer") or ""
    host = urlparse(origin).hostname or ""
    host = host.lower()
    # allow exact match or subdomain of an allowed domain
    ok = any(host == d or host.endswith("." + d) for d in allowed)
    if not ok:
        raise HTTPException(status_code=403, detail="This domain is not allowed to use this widget")


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
    request: Request,
    tenant: Tenant = Depends(get_tenant_for_chat),
    db: Session = Depends(get_db),
):
    """RAG chat with Server-Sent-Events streaming.

    Emits events:
      - {"type": "sources", "sources": [...]}
      - {"type": "token", "text": "..."}
      - {"type": "done", "conversation_id": "..."}
    """
    # Abuse protection: domain allowlist + rate limits + message size cap.
    _check_domain(tenant, request)
    if not ratelimit.check(f"chat:tenant:{tenant.id}", settings.chat_rate_per_tenant_per_min):
        raise HTTPException(status_code=429, detail="Too many requests — please slow down")
    if not ratelimit.check(f"chat:ip:{_client_ip(request)}", settings.chat_rate_per_ip_per_min):
        raise HTTPException(status_code=429, detail="Too many requests — please slow down")

    _check_quota(db, tenant)

    question = payload.message.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Empty message")
    if len(question) > settings.max_message_chars:
        raise HTTPException(status_code=413, detail="Message too long")

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
