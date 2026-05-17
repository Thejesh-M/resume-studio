from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.security import get_current_user
from src.models.user import User
from src.schemas.common import ApiResponse
from src.schemas.user import UserResponse, UserUpdateRequest
from src.services import user_service

router = APIRouter(prefix="/users", tags=["users"])

CurrentUser = Annotated[User, Depends(get_current_user)]
DB = Annotated[AsyncSession, Depends(get_db)]


@router.get("/me", response_model=ApiResponse[UserResponse])
async def get_me(user: CurrentUser) -> dict:
    result = await user_service.get_current(user)
    return {"success": True, "data": UserResponse.model_validate(result)}


@router.patch("/me", response_model=ApiResponse[UserResponse])
async def update_me(user: CurrentUser, db: DB, payload: UserUpdateRequest) -> dict:
    result = await user_service.update_profile(db, user, payload)
    return {"success": True, "data": UserResponse.model_validate(result)}
