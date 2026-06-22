from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session

from .database import get_db
from .models import Tenant


def get_current_tenant(
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
    db: Session = Depends(get_db),
) -> Tenant:
    """Admin auth — the secret api_key. Used by the dashboard/management endpoints."""
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")
    tenant = db.query(Tenant).filter(Tenant.api_key == x_api_key).first()
    if not tenant:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return tenant


def get_tenant_for_chat(
    x_widget_key: str | None = Header(default=None, alias="X-Widget-Key"),
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
    db: Session = Depends(get_db),
) -> Tenant:
    """Chat auth — accepts the publishable widget_key (preferred) or the secret api_key.

    The widget_key is safe to embed publicly; it is scoped to chat only.
    """
    if x_widget_key:
        tenant = db.query(Tenant).filter(Tenant.widget_key == x_widget_key).first()
        if tenant:
            return tenant
    if x_api_key:
        tenant = db.query(Tenant).filter(Tenant.api_key == x_api_key).first()
        if tenant:
            return tenant
    raise HTTPException(status_code=401, detail="Missing or invalid widget key")
