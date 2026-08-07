from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

from routers import auth, billing, comments, customers, tickets, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    # create_tables() is only for local SQLite dev.
    # In production, Alembic runs migrations — don't let create_all mask drift.
    if settings.DEBUG:
        create_tables()
    await init_redis()
    yield
    await close_redis()


app = FastAPI(
    title="TicketDesk API",
    description="Multi-tenant SaaS support ticketing platform",
    version="0.1.0",
    lifespan=lifespan,
    swagger_ui_parameters={"syntaxHighlight": False},
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

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(tickets.router)
app.include_router(comments.router)
app.include_router(customers.router)
app.include_router(billing.router)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}


@app.get("/", tags=["health"])
def root():
    return {"message": "TicketDesk API is running", "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
