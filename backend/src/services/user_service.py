from sqlalchemy.ext.asyncio import AsyncSession

from src.models.user import User
from src.schemas.user import UserUpdateRequest


async def get_current(user: User) -> User:
    """Return the current user (identity pass-through for consistency)."""
    return user


async def update_profile(db: AsyncSession, user: User, payload: UserUpdateRequest) -> User:
    """Update user profile fields. Only provided (non-None) fields are updated."""
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user
