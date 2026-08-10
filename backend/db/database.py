from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from core.config import settings


DATABASE_URL = settings.DATABASE_URL

# Configure engine based on database type
if DATABASE_URL.startswith("sqlite"):
    # SQLite-specific configuration
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL configuration (production)
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Enable connection health checks
        pool_size=10,  # Connection pool size
        max_overflow=20,  # Max overflow connections
    )


SessionLocal = sessionmaker(autocommit=False, autoflush=True, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    Base.metadata.create_all(engine)