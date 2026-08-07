"""
Per-tenant sliding-window rate limiter backed by Redis.

Algorithm: fixed window with atomic Lua increment.
  - Key:   rl:{tenant_id}:{current_minute_epoch}
  - TTL:   70 seconds (window + small buffer so Redis cleans up itself)
  - Limit: 100 req/min for free tier, 1 000 req/min for paid tier

The Lua script makes the increment + TTL-set atomic so there is no
race condition between two concurrent requests for the same tenant.
"""

from __future__ import annotations

import time

import redis.asyncio as aioredis
from fastapi import HTTPException, Request, status

from core.config import settings

# ---------------------------------------------------------------------------
# Redis connection (module-level singleton, created lazily in lifespan)
# ---------------------------------------------------------------------------

_redis: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    if _redis is None:
        raise RuntimeError("Redis has not been initialised — call init_redis() first")
    return _redis


async def init_redis() -> None:
    """Call once at application startup (inside the lifespan context manager)."""
    global _redis
    try:
        _redis = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
        await _redis.ping()
    except Exception:
        # Redis is unavailable — rate limiting will be disabled.
        # In production this should be treated as a fatal error.
        import warnings
        warnings.warn(
            "Redis is unreachable — rate limiting is DISABLED. "
            "Start Redis before deploying to production.",
            RuntimeWarning,
            stacklevel=2,
        )
        _redis = None


async def close_redis() -> None:
    """Call once at application shutdown."""
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None


# ---------------------------------------------------------------------------
# Lua script — atomic increment + conditional expire
# ---------------------------------------------------------------------------
# KEYS[1]  = the rate-limit key
# ARGV[1]  = TTL in seconds
#
# Returns the new counter value after increment.

_LUA_INCR_EXPIRE = """
local current = redis.call('INCR', KEYS[1])
if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return current
"""


# ---------------------------------------------------------------------------
# Public helper
# ---------------------------------------------------------------------------

async def check_rate_limit(tenant_id: int, tier: str) -> None:
    """
    Increment the per-tenant counter for the current minute window.
    Raises HTTP 429 if the tenant has exceeded their tier's limit.
    No-ops silently if Redis is unavailable.
    """
    if _redis is None:
        return  # Redis down — skip rate limiting

    limit = settings.RATE_LIMIT_PAID if tier == "paid" else settings.RATE_LIMIT_FREE
    window = int(time.time()) // 60
    key = f"rl:{tenant_id}:{window}"
    ttl = 70

    try:
        count = await _redis.eval(_LUA_INCR_EXPIRE, 1, key, ttl)  # type: ignore[arg-type]
    except Exception:
        return  # Redis error — let the request through

    if count > limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Rate limit exceeded: {limit} requests/min for the {tier} tier. "
                "Upgrade to paid for a higher limit."
            ),
            headers={"Retry-After": "60"},
        )


# ---------------------------------------------------------------------------
# FastAPI middleware
# ---------------------------------------------------------------------------

class RateLimitMiddleware:
    """
    ASGI middleware that enforces per-tenant rate limits on every request.

    Skipped for:
      - Unauthenticated requests (no Bearer token / invalid JWT) — the auth
        layer will reject them anyway.
      - The Stripe webhook path — Stripe retries on 429 and we don't want to
        accidentally drop legitimate webhook deliveries.
      - Health-check paths.
    """

    # Note: middleware is applied in reverse-add order in Starlette, so
    # CORSMiddleware (added after this) actually runs first. Unauthenticated
    # OPTIONS preflights pass through here without a Bearer token and are
    # transparently forwarded — no rate-limit key is extracted.
    _SKIP_PREFIXES = ("/webhooks/", "/health", "/docs", "/openapi", "/redoc")

    # Auth paths rate-limited by IP (no JWT available yet)
    _AUTH_PREFIXES = ("/auth/login", "/auth/signup", "/auth/forgot-password")

    def __init__(self, app) -> None:
        self.app = app

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path: str = scope.get("path", "")

        # Skip paths that don't need rate limiting
        if any(path.startswith(prefix) for prefix in self._SKIP_PREFIXES):
            await self.app(scope, receive, send)
            return

        # Auth endpoints: rate limit by IP address (no JWT present yet)
        if any(path.startswith(prefix) for prefix in self._AUTH_PREFIXES):
            headers = dict(scope.get("headers", []))
            client_ip = (
                headers.get(b"x-forwarded-for", b"").decode().split(",")[0].strip()
                or (scope.get("client") or ("unknown", 0))[0]
            )
            key = f"rl:ip:{client_ip}:{int(time.time()) // 60}"
            try:
                if _redis is not None:
                    count = await _redis.eval(_LUA_INCR_EXPIRE, 1, key, 70)
                    if count > 20:  # 20 auth attempts per minute per IP
                        from fastapi.responses import JSONResponse
                        response = JSONResponse(
                            status_code=429,
                            content={"detail": "Too many requests. Please try again later."},
                            headers={"Retry-After": "60"},
                        )
                        await response(scope, receive, send)
                        return
            except Exception:
                pass  # Redis down — let the request through
            await self.app(scope, receive, send)
            return

        # All other paths: rate limit by tenant_id from JWT
        tenant_id, tier = _extract_tenant_from_scope(scope)

        if tenant_id is not None:
            # We build a lightweight Request just to surface a clean HTTP 429
            # if the limit is breached.
            request = Request(scope, receive)
            try:
                await check_rate_limit(tenant_id, tier)
            except HTTPException as exc:
                from fastapi.responses import JSONResponse
                response = JSONResponse(
                    status_code=exc.status_code,
                    content={"detail": exc.detail},
                    headers=exc.headers or {},
                )
                await response(scope, receive, send)
                return

        await self.app(scope, receive, send)


def _extract_tenant_from_scope(scope: dict) -> tuple[int | None, str]:
    """
    Parse the Authorization header from the ASGI scope and return
    (tenant_id, tier).  Returns (None, "free") if the token is absent
    or cannot be decoded — those requests will just pass through and be
    rejected by the auth dependency as usual.
    """
    headers = dict(scope.get("headers", []))
    auth_header: bytes = headers.get(b"authorization", b"")

    if not auth_header.startswith(b"Bearer "):
        return None, "free"

    raw_token = auth_header[len(b"Bearer "):].decode("utf-8", errors="ignore").strip()

    try:
        from core.security import decode_token
        payload = decode_token(raw_token)
        if payload.get("type") != "access":
            return None, "free"

        tenant_id = int(payload["tenant_id"])
        tier = payload.get("tier", "free")          # tier baked into JWT (see below)
        return tenant_id, tier
    except Exception:
        return None, "free"
