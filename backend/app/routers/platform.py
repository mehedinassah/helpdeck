"""Partner/platform API.

Trusted partners (e.g. the Perico ERP) provision and manage Helpdeck tenants
server-to-server. Authenticated with a shared secret in the X-Platform-Key header,
which is separate from per-tenant API keys.
"""
import secrets

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import Tenant
from ..schemas import TenantOut

router = APIRouter(prefix="/api/platform", tags=["platform"])


def require_platform_key(x_platform_key: str | None = Header(default=None, alias="X-Platform-Key")):
    if not settings.platform_api_key:
        raise HTTPException(status_code=503, detail="Platform integration not configured")
    if not x_platform_key or not secrets.compare_digest(x_platform_key, settings.platform_api_key):
        raise HTTPException(status_code=401, detail="Invalid platform key")


class PlatformTenantCreate(BaseModel):
    name: str
    plan: str = "pro"
    message_limit: int = 2000
    source: str = "perico"


@router.post("/tenants", response_model=TenantOut, dependencies=[Depends(require_platform_key)])
def provision_tenant(payload: PlatformTenantCreate, db: Session = Depends(get_db)):
    """Create a tenant on behalf of a partner platform and return its API key."""
    tenant = Tenant(
        name=payload.name,
        api_key="hd_" + secrets.token_urlsafe(32),
        plan=payload.plan,
        message_limit=payload.message_limit,
        source=payload.source,
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant
