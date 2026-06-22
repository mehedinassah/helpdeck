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
        conn.execute(
            text(
                "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS "
                "status varchar(32) NOT NULL DEFAULT 'active'"
            )
        )
        conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_customer_id varchar(64)"))
        conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_subscription_id varchar(64)"))
        conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS widget_key varchar(64)"))
        conn.execute(text("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS allowed_domains text"))
        # Backfill a publishable widget key for any tenant created before this column existed.
        conn.execute(
            text(
                "UPDATE tenants SET widget_key = 'wk_' || replace(gen_random_uuid()::text, '-', '') "
                "WHERE widget_key IS NULL"
            )
        )
        conn.execute(
            text("CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_widget_key ON tenants (widget_key)")
        )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
