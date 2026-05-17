import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.security import get_current_user
from src.models.user import User
from src.schemas.common import ApiResponse
from src.schemas.tailoring import (
    TailoredVersionResponse,
    TailoringStartRequest,
    TailoringStartResponse,
    TaskStatusResponse,
)
from src.services import tailoring_service

router = APIRouter(prefix="/tailoring", tags=["tailoring"])

CurrentUser = Annotated[User, Depends(get_current_user)]
DB = Annotated[AsyncSession, Depends(get_db)]


@router.post(
    "/start",
    response_model=ApiResponse[TailoringStartResponse],
    status_code=201,
)
async def start_tailoring(
    user: CurrentUser, db: DB, payload: TailoringStartRequest
) -> dict:
    result = await tailoring_service.start(db, user, payload.resume_id, payload.jd_text)
    return {"success": True, "data": result}


@router.get(
    "/status/{task_id}",
    response_model=ApiResponse[TaskStatusResponse],
)
async def get_status(user: CurrentUser, task_id: str) -> dict:
    result = await tailoring_service.get_status(task_id)
    return {"success": True, "data": result}


@router.get(
    "/result/{task_id}",
    response_model=ApiResponse[TailoredVersionResponse],
)
async def get_result(user: CurrentUser, db: DB, task_id: str) -> dict:
    version = await tailoring_service.get_result(db, user, task_id)
    return {
        "success": True,
        "data": TailoredVersionResponse.model_validate(version),
    }


@router.get(
    "/versions",
    response_model=ApiResponse[list[TailoredVersionResponse]],
)
async def list_versions(
    user: CurrentUser,
    db: DB,
    resume_id: uuid.UUID | None = None,
) -> dict:
    versions = await tailoring_service.list_versions(db, user, resume_id)
    return {
        "success": True,
        "data": [TailoredVersionResponse.model_validate(v) for v in versions],
    }


@router.get(
    "/versions/{version_id}",
    response_model=ApiResponse[TailoredVersionResponse],
)
async def get_version(
    user: CurrentUser, db: DB, version_id: uuid.UUID
) -> dict:
    version = await tailoring_service.get_version_by_id(db, user, version_id)
    return {
        "success": True,
        "data": TailoredVersionResponse.model_validate(version),
    }
