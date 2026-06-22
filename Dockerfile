# Helpdeck backend (FastAPI + fastembed) — container image for Render/Fly/Railway free tiers.
# Build context = repo root so the widget/ folder ships alongside the backend.
FROM python:3.11-slim

# fastembed/onnxruntime + psycopg2-binary ship as wheels; no system build deps needed.
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/tmp/hf \
    FASTEMBED_CACHE_PATH=/tmp/fastembed

WORKDIR /app

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install -r backend/requirements.txt

COPY backend ./backend
COPY widget ./widget

WORKDIR /app/backend

# Render/most PaaS inject $PORT; default to 8000 locally.
ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
