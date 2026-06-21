from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import init_db
from .routers import tenants, documents, chat

WIDGET_DIR = Path(__file__).resolve().parents[2] / "widget"


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Helpdeck API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tenants.router)
app.include_router(documents.router)
app.include_router(chat.router)

# Serve the embeddable widget + demo page (widget.js, demo.html)
if WIDGET_DIR.exists():
    app.mount("/widget", StaticFiles(directory=str(WIDGET_DIR), html=True), name="widget")


@app.get("/health")
def health():
    return {"status": "ok", "model": settings.llm_model, "embeddings": settings.embedding_model}
