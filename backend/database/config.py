"""
Database configuration and session management.
"""

import os
from typing import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
)
from sqlalchemy.pool import StaticPool

# Database URL - defaults to SQLite for local development
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite+aiosqlite:///./storyboard.db"
)

# For SQLite, we need special handling
is_sqlite = DATABASE_URL.startswith("sqlite")

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=os.getenv("DATABASE_ECHO", "false").lower() == "true",
    # SQLite-specific settings
    connect_args={"check_same_thread": False} if is_sqlite else {},
    poolclass=StaticPool if is_sqlite else None,
)

# Create async session factory
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def init_db():
    """Initialize the database, creating all tables."""
    from database.models import Base
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Close database connections."""
    await engine.dispose()


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Get an async database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Context manager for database sessions."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

