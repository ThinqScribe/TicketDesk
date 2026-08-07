from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = ""
    DEBUG: bool = False
    ALLOWED_ORIGINS: List[str] = []
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    API_PREFIX: str = ""

    FRONTEND_URL: str = "http://localhost:3000"

    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "noreply@ticketdesk.dev"

    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLIC_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PAID_PRICE_ID: str = ""  # the Price ID from your Stripe dashboard

    REDIS_URL: str = "redis://localhost:6379/0"

    # Requests per minute per tenant
    RATE_LIMIT_FREE: int = 100
    RATE_LIMIT_PAID: int = 1000

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, value):
        if not value:
            return []
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",")]
        return value

    class Config:
        env_file = ".env"
        case_sensitive = True
        encoding = "utf-8"


settings = Settings()
