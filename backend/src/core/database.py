from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from src.core.config import settings

_is_sqlite = settings.database_url.startswith("sqlite")

# SQLite ignores pool_size/max_overflow; only pass them for server-backed DBs.
_engine_kwargs: dict = {"echo": False}
if not _is_sqlite:
    _engine_kwargs.update(
        pool_size=5,
        max_overflow=10,
        pool_timeout=30,
        pool_recycle=1800,
        pool_pre_ping=True,
    )

engine = create_async_engine(settings.database_url, **_engine_kwargs)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db() -> None:
    """Create tables and seed bundled templates. Idempotent."""
    from src.models import register_models  # noqa: F401  (ensures models import)

    register_models()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Populate the templates table from backend/templates/ on disk.
    from scripts.seed_templates import seed as seed_templates

    async with async_session() as session:
        await seed_templates(session)
