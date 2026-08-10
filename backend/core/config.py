from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = ""
    DEBUG: bool = False
    ALLOWED_ORIGINS: str = ""  # stored as comma-separated string, parsed below
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    API_PREFIX: str = ""

    FRONTEND_URL: str = "http://localhost:3000"

    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "noreply@ticketdesk.dev"
    RESEND_INBOUND_SECRET: str = ""
    INBOUND_EMAIL_DOMAIN: str = ""

    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLIC_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PAID_PRICE_ID: str = ""

    REDIS_URL: str = "redis://localhost:6379/0"

    RATE_LIMIT_FREE: int = 100
    RATE_LIMIT_PAID: int = 1000

    SENTRY_DSN: str = ""

    @property
    def allowed_origins_list(self) -> List[str]:
        """Return ALLOWED_ORIGINS as a parsed list."""
        if not self.ALLOWED_ORIGINS:
            return []
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        case_sensitive = True
        encoding = "utf-8"


settings = Settings()
