"""Standalone Stripe billing (global, USD).

Endpoints:
  GET  /api/billing/plans     -> available plans + current plan (tenant auth)
  POST /api/billing/checkout  -> Stripe Checkout Session URL (tenant auth)
  POST /api/billing/portal    -> Stripe customer portal URL (tenant auth)
  POST /api/billing/webhook   -> Stripe events (signature-verified, no auth)
"""
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..deps import get_current_tenant
from ..models import Tenant
from ..plans import PLANS, DEFAULT_PLAN, plan_message_limit, stripe_price_id, plan_for_price_id

router = APIRouter(prefix="/api/billing", tags=["billing"])


def _require_stripe() -> None:
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=503, detail="Billing is not configured")
    stripe.api_key = settings.stripe_secret_key


class CheckoutRequest(BaseModel):
    plan: str  # "pro" | "business"


@router.get("/plans")
def list_plans(tenant: Tenant = Depends(get_current_tenant)):
    return {
        "configured": bool(settings.stripe_secret_key),
        "current_plan": tenant.plan,
        "status": tenant.status,
        "plans": [
            {"id": p.id, "name": p.name, "price_usd": p.price_usd, "message_limit": p.message_limit}
            for p in PLANS.values()
        ],
    }


@router.post("/checkout")
def create_checkout(
    payload: CheckoutRequest,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    _require_stripe()
    price_id = stripe_price_id(payload.plan)
    if not price_id:
        raise HTTPException(status_code=400, detail=f"No Stripe price configured for plan '{payload.plan}'")

    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        customer=tenant.stripe_customer_id or None,
        client_reference_id=tenant.id,
        metadata={"tenant_id": tenant.id, "plan": payload.plan},
        subscription_data={"metadata": {"tenant_id": tenant.id}},
        success_url=settings.billing_success_url,
        cancel_url=settings.billing_cancel_url,
        allow_promotion_codes=True,
    )
    return {"url": session.url}


@router.post("/portal")
def create_portal(tenant: Tenant = Depends(get_current_tenant)):
    _require_stripe()
    if not tenant.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No subscription to manage yet")
    session = stripe.billing_portal.Session.create(
        customer=tenant.stripe_customer_id,
        return_url=settings.billing_success_url,
    )
    return {"url": session.url}


def _apply_plan(db: Session, tenant: Tenant, plan_id: str, status: str) -> None:
    tenant.plan = plan_id
    tenant.message_limit = plan_message_limit(plan_id)
    tenant.status = status
    db.commit()


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=503, detail="Webhook not configured")
    stripe.api_key = settings.stripe_secret_key

    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, settings.stripe_webhook_secret)
    except (ValueError, stripe.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    obj = event["data"]["object"]
    etype = event["type"]

    def find_tenant() -> Tenant | None:
        tid = (obj.get("metadata") or {}).get("tenant_id") or obj.get("client_reference_id")
        if tid:
            t = db.query(Tenant).filter(Tenant.id == tid).first()
            if t:
                return t
        cust = obj.get("customer")
        if cust:
            return db.query(Tenant).filter(Tenant.stripe_customer_id == cust).first()
        return None

    if etype == "checkout.session.completed":
        tenant = find_tenant()
        if tenant:
            tenant.stripe_customer_id = obj.get("customer") or tenant.stripe_customer_id
            tenant.stripe_subscription_id = obj.get("subscription") or tenant.stripe_subscription_id
            plan_id = (obj.get("metadata") or {}).get("plan") or "pro"
            _apply_plan(db, tenant, plan_id, "active")

    elif etype in ("customer.subscription.updated", "customer.subscription.created"):
        tenant = find_tenant()
        if tenant:
            items = (obj.get("items") or {}).get("data") or []
            price_id = items[0]["price"]["id"] if items else None
            plan_id = plan_for_price_id(price_id) or tenant.plan
            active = obj.get("status") in ("active", "trialing")
            tenant.stripe_subscription_id = obj.get("id") or tenant.stripe_subscription_id
            _apply_plan(db, tenant, plan_id if active else DEFAULT_PLAN, "active" if active else "inactive")

    elif etype == "customer.subscription.deleted":
        tenant = find_tenant()
        if tenant:
            tenant.stripe_subscription_id = None
            _apply_plan(db, tenant, DEFAULT_PLAN, "active")  # back to free

    return {"received": True}
