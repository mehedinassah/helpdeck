import secrets

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_tenant
from ..models import Tenant, Message
from ..schemas import TenantCreate, TenantOut, UsageOut

router = APIRouter(prefix="/api", tags=["tenants"])


@router.post("/tenants", response_model=TenantOut)
def create_tenant(payload: TenantCreate, db: Session = Depends(get_db)):
    """Sign up a business and issue an API key for the widget."""
    tenant = Tenant(name=payload.name, api_key="hd_" + secrets.token_urlsafe(32))
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant


@router.get("/me", response_model=TenantOut)
def me(tenant: Tenant = Depends(get_current_tenant)):
    return tenant


@router.get("/usage", response_model=UsageOut)
def usage(tenant: Tenant = Depends(get_current_tenant), db: Session = Depends(get_db)):
    used = (
        db.query(Message)
        .filter(Message.tenant_id == tenant.id, Message.role == "user")
        .count()
    )
    return UsageOut(
        plan=tenant.plan,
        message_limit=tenant.message_limit,
        messages_used=used,
        messages_remaining=max(tenant.message_limit - used, 0),
    )
