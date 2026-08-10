from contextlib import asynccontextmanager
import logging
import sys
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import settings
from core.rate_limit import RateLimitMiddleware, close_redis, init_redis
from db.database import create_tables

# Import all models so SQLAlchemy registers them with Base before create_all runs
import models.comment
import models.customer
import models.subscription
import models.tenant
import models.ticket
import models.user

from routers import auth, billing, comments, customers, tickets, users, tenant, inbound

# Sentry error monitoring (production)
if settings.SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
    
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[
            FastApiIntegration(),
            SqlalchemyIntegration(),
        ],
        traces_sample_rate=1.0 if settings.DEBUG else 0.1,
        environment="development" if settings.DEBUG else "production",
        release="ticketdesk@0.1.0",
    )

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # create_tables() is only for local SQLite dev.
    # In production, Alembic runs migrations — don't let create_all mask drift.
    if settings.DEBUG:
        create_tables()
    await init_redis()
    logger.info("Application startup complete")
    yield
    await close_redis()
    logger.info("Application shutdown complete")


app = FastAPI(
    title="TicketDesk API",
    description="Multi-tenant SaaS support ticketing platform",
    version="0.1.0",
    lifespan=lifespan,
    swagger_ui_parameters={"syntaxHighlight": False},
)

# Add global exception handler for better error logging
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception on {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# Rate limiting must be added before CORS so it runs on every real request
app.add_middleware(RateLimitMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(users.router, prefix=settings.API_PREFIX)
app.include_router(tickets.router, prefix=settings.API_PREFIX)
app.include_router(comments.router, prefix=settings.API_PREFIX)
app.include_router(customers.router, prefix=settings.API_PREFIX)
app.include_router(billing.router, prefix=settings.API_PREFIX)
app.include_router(tenant.router, prefix=settings.API_PREFIX)
app.include_router(inbound.router, prefix=settings.API_PREFIX)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


@app.get("/", tags=["health"])
def root():
    return {"message": "TicketDesk API is running", "docs": "/docs", "version": "0.1.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
