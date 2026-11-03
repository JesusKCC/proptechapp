from typing import AsyncGenerator
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine
)
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.db.base import Base

# Determine connect args
is_sqlite = settings.is_sqlite
if is_sqlite:
    async_connect_args = {"check_same_thread": False}
elif settings.database_requires_ssl:
    async_connect_args = {"ssl": True}
else:
    async_connect_args = {}
sync_connect_args = {"check_same_thread": False} if is_sqlite else {}

# Asynchronous engine & session factory. pool_pre_ping recovers connections that a
# serverless Postgres (e.g. Neon) closed while the free instance was asleep.
async_engine = create_async_engine(
    settings.async_database_url,
    echo=False,
    future=True,
    connect_args=async_connect_args,
    pool_pre_ping=not is_sqlite,
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Synchronous engine & session factory (used by seed.py and quick management)
sync_engine = create_engine(
    settings.sync_database_url,
    echo=False,
    future=True,
    connect_args=sync_connect_args,
    pool_pre_ping=not is_sqlite,
)

SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# Columns added after the first release. create_all() only creates missing tables,
# so existing databases get these through a plain ALTER TABLE.
ADDED_COLUMNS = [
    ("centros_comerciales", "plano_url", "TEXT"),
]


def _add_missing_columns(conn):
    inspector = inspect(conn)
    for table, column, ddl_type in ADDED_COLUMNS:
        existing = {c["name"] for c in inspector.get_columns(table)}
        if column not in existing:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl_type}"))


async def init_db():
    """Initializes all database tables asynchronously."""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_add_missing_columns)


def init_db_sync():
    """Initializes all database tables synchronously."""
    Base.metadata.create_all(bind=sync_engine)
    with sync_engine.begin() as conn:
        _add_missing_columns(conn)
