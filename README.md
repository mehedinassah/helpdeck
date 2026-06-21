# Helpdeck

**AI Customer-Support / Knowledge Assistant (RAG).**
A business uploads its docs/FAQ and gets an embeddable AI chat widget for its website.

Built with **FastAPI + Postgres/pgvector + Groq (LLM) + fastembed (local embeddings)**.

---

## Why this architecture

| Concern | Choice | Why |
|---|---|---|
| API | FastAPI (Python) | Dominant AI/RAG ecosystem, async streaming |
| Vectors | Postgres + pgvector | One DB for app data *and* embeddings, cheap, no extra service |
| Chat LLM | Groq (OpenAI-compatible) | Free tier, very fast; swap to DeepSeek/OpenAI via env only |
| Embeddings | fastembed (local ONNX) | $0, no API key — Groq/DeepSeek don't offer embeddings |
| Multi-tenancy | API key per business | Each tenant's data isolated by `tenant_id` |
| Billing | Usage metering (messages) | Foundation for usage-based subscription |

## Architecture (MVP)

```
Business dashboard ──> POST /api/documents ──> chunk ──> embed (fastembed) ──> pgvector
Website widget ──────> POST /api/chat ──> embed query ──> vector search ──> Groq (stream) ──> SSE
```

## Quick start

### 1. Start Postgres (with pgvector)
```bash
docker compose up -d
```

### 2. Configure the backend
```bash
cd backend
cp .env.example .env          # Windows: copy .env.example .env
# edit .env and set LLM_API_KEY  (free Groq key: https://console.groq.com/keys)
```

### 3. Install + run
```bash
python -m venv .venv
.venv\Scripts\activate         # Windows
# source .venv/bin/activate    # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs

## API

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/tenants` | – | Create business, get API key |
| GET  | `/api/me` | API key | Current tenant |
| GET  | `/api/usage` | API key | Usage vs plan limit |
| GET  | `/api/documents` | API key | List knowledge docs |
| POST | `/api/documents` | API key | Add doc from text |
| POST | `/api/documents/upload` | API key | Upload .txt/.md/.pdf |
| DELETE | `/api/documents/{id}` | API key | Delete doc |
| POST | `/api/chat` | API key | RAG chat (SSE stream) |

All authenticated routes require header: `X-API-Key: <key>`

### Example
```bash
# 1. create a tenant
curl -X POST localhost:8000/api/tenants -H "Content-Type: application/json" \
  -d '{"name":"Acme Inc"}'
# -> { "api_key": "hd_...", ... }

# 2. add knowledge
curl -X POST localhost:8000/api/documents -H "X-API-Key: hd_..." \
  -H "Content-Type: application/json" \
  -d '{"title":"Refund policy","content":"We offer refunds within 30 days..."}'

# 3. chat (streams)
curl -N -X POST localhost:8000/api/chat -H "X-API-Key: hd_..." \
  -H "Content-Type: application/json" \
  -d '{"message":"What is your refund policy?"}'
```

## Roadmap

- [x] Multi-tenant API keys
- [x] Text/PDF ingestion + chunking + embeddings
- [x] pgvector retrieval + streaming RAG chat
- [x] Usage metering
- [ ] React dashboard (manage docs, view usage)
- [ ] Embeddable JS widget (`<script>` snippet)
- [ ] Stripe usage-based billing
- [ ] Conversation history in widget
- [ ] Per-document re-indexing & analytics

## Tech stack

`FastAPI` · `SQLAlchemy 2` · `Postgres 16` · `pgvector` · `fastembed` · `Groq` · `React` (next)
