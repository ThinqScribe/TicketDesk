import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# Make sure the backend package is on the path when running via
# `alembic upgrade head` from the backend directory.
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Import Base and every model so their tables are registered in metadata.
from db.database import Base  # noqa: E402
import models.comment          # noqa: E402, F401
import models.customer         # noqa: E402, F401
import models.subscription     # noqa: E402, F401
import models.tenant           # noqa: E402, F401
import models.ticket           # noqa: E402, F401
import models.user             # noqa: E402, F401

from core.config import settings  # noqa: E402

config = context.config

# Wire the database URL from application settings — no hard-coded credentials.
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# render_as_batch=True lets Alembic work around SQLite's limited ALTER TABLE
# support by rebuilding tables in a transaction.  Postgres ignores this flag.
_MIGRATION_KWARGS = {
    "target_metadata": target_metadata,
    "compare_type": True,
    "render_as_batch": True,
}


def run_migrations_offline() -> None:
    """Emit SQL to stdout without an active DB connection."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, literal_binds=True, **_MIGRATION_KWARGS)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations against a live database connection."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, **_MIGRATION_KWARGS)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
