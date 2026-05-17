"""No-auth dependency for the local single-user app.

The original SaaS authenticated requests with Firebase ID tokens. The local
build has no users to distinguish, so ``get_current_user`` simply returns the
synthetic local user (auto-created on first access). Keeping the same function
name means every route can stay unchanged.
"""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.database import get_db
from src.models.user import User

logger = logging.getLogger(__name__)


async def _get_or_create_local_user(db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.local_id == settings.local_user_id))
    user = result.scalar_one_or_none()
    if user is not None:
        return user

    user = User(
        local_id=settings.local_user_id,
        email=settings.local_user_email,
        name="Local User",
    )
    db.add(user)
    await db.flush()
    logger.info("Created local user id=%s", user.id)
    return user


async def get_current_user(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """FastAPI dependency: returns the single local user.

    No header parsing, no token verification — this is a local app.
    """
    return await _get_or_create_local_user(db)
