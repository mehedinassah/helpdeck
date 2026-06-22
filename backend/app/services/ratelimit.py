"""Tiny in-memory sliding-window rate limiter.

Per-process (fine for a single instance / MVP). For multi-instance scale,
swap the store for Redis with the same interface.
"""
import time
from collections import defaultdict

_hits: dict[str, list[float]] = defaultdict(list)


def check(key: str, limit: int, window_sec: int = 60) -> bool:
    """Return True if the request is allowed, False if the limit is exceeded."""
    now = time.time()
    cutoff = now - window_sec
    bucket = _hits[key]
    # drop timestamps outside the window
    i = 0
    for i, ts in enumerate(bucket):
        if ts >= cutoff:
            break
    else:
        i = len(bucket)
    if i:
        del bucket[:i]
    if len(bucket) >= limit:
        return False
    bucket.append(now)
    return True
