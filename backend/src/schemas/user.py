from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    name: str | None
    avatar_url: str | None
    onboarding_completed: bool
    created_at: datetime
    updated_at: datetime


class UserUpdateRequest(BaseModel):
    name: str | None = None
    avatar_url: str | None = None
    onboarding_completed: bool | None = None
