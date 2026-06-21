from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session

from .database import get_db
from .models import Tenant


def get_current_tenant(
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
    db: Session = Depends(get_db),
) -> Tenant:
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")
    tenant = db.query(Tenant).filter(Tenant.api_key == x_api_key).first()
    if not tenant:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return tenant
