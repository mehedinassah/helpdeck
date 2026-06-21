"""End-to-end smoke test: DB + pgvector + embeddings + Groq. Run from backend/."""
from app.database import init_db, SessionLocal
from app.models import Tenant
from app.services.ingest import ingest_document
from app.services.retrieval import retrieve, build_context
from app.services.llm import build_messages, stream_chat
import secrets

print("1) init_db (create extension + tables + index)...")
init_db()
print("   OK")

db = SessionLocal()
try:
    print("2) create tenant...")
    t = Tenant(name="Smoke Test Co", api_key="hd_" + secrets.token_urlsafe(16))
    db.add(t)
    db.commit()
    db.refresh(t)
    print("   tenant id:", t.id)

    print("3) ingest document (downloads embedding model on first run)...")
    doc = ingest_document(
        db, t.id, "Refund Policy",
        "Helpdeck offers a 30-day money-back guarantee on all paid plans. "
        "Refunds are processed within 5 business days to the original payment method. "
        "Free trials can be cancelled anytime with no charge.",
    )
    print("   chunks:", doc.chunk_count)

    print("4) retrieve...")
    results = retrieve(db, t.id, "How long do I have to get my money back?")
    for chunk, title, score in results:
        print(f"   [{score:.3f}] {title}: {chunk.content[:60]}...")

    print("5) Groq chat (streaming)...")
    ctx = build_context(results)
    msgs = build_messages("How long do I have to get my money back?", ctx)
    print("   answer: ", end="", flush=True)
    for tok in stream_chat(msgs):
        print(tok, end="", flush=True)
    print("\n\nALL GOOD")

    # cleanup
    db.delete(t)
    db.commit()
    print("(cleaned up test tenant)")
finally:
    db.close()
