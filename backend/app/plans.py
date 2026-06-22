"""Standalone (global, USD) subscription plans for Helpdeck.

Single source of truth for plan limits and the Stripe Price ID mapping.
"""
from .config import settings


class Plan:
    def __init__(self, id: str, name: str, price_usd: int, message_limit: int):
        self.id = id
        self.name = name
        self.price_usd = price_usd
        self.message_limit = message_limit


PLANS: dict[str, Plan] = {
    "free": Plan("free", "Free", 0, 100),
    "pro": Plan("pro", "Pro", 19, 2000),
    "business": Plan("business", "Business", 49, 10000),
}

DEFAULT_PLAN = "free"


def plan_message_limit(plan_id: str) -> int:
    p = PLANS.get(plan_id)
    return p.message_limit if p else PLANS[DEFAULT_PLAN].message_limit


def stripe_price_id(plan_id: str) -> str | None:
    """Map a paid plan to its configured Stripe Price ID."""
    return {
        "pro": settings.stripe_price_pro or None,
        "business": settings.stripe_price_business or None,
    }.get(plan_id)


def plan_for_price_id(price_id: str) -> str | None:
    """Reverse lookup: Stripe Price ID -> plan id (used by the webhook)."""
    if price_id and price_id == settings.stripe_price_pro:
        return "pro"
    if price_id and price_id == settings.stripe_price_business:
        return "business"
    return None
