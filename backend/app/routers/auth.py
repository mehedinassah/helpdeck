"""Email + password authentication for the standalone product.

Email/password is the human login; the returned api_key is the credential used
for all subsequent API calls (stored client-side like a session token).
"""
import re
import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Tenant
from ..schemas import SignupRequest, LoginRequest, TenantOut
from ..services.passwords import hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@router.post("/signup", response_model=TenantOut)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if not _EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Enter a valid email address")
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if db.query(Tenant).filter(Tenant.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    tenant = Tenant(
        name=(payload.name or email.split("@")[0]).strip() or "My Business",
        email=email,
        password_hash=hash_password(payload.password),
        api_key="hd_" + secrets.token_urlsafe(32),
        widget_key="wk_" + secrets.token_urlsafe(24),
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant


@router.post("/login", response_model=TenantOut)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    tenant = db.query(Tenant).filter(Tenant.email == email).first()
    if not tenant or not verify_password(payload.password, tenant.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return tenant
