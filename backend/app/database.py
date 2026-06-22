from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

from .config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


def init_db() -> None:
    """Enable pgvector and create tables + vector index."""
    # Import models so they register on Base.metadata
    from . import models  # noqa: F401

    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        # Approximate-nearest-neighbour index for cosine similarity.
        conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS idx_chunks_embedding "
                "ON chunks USING hnsw (embedding vector_cosine_ops)"
            )
        )
        # Lightweight, idempotent column migrations (create_all won't ALTER).
        conn.execute(
            text(
                "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "
                "source varchar(32) NOT NULL DEFAULT 'standalone'"
            )
        )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
