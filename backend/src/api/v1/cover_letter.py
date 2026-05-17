from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.security import get_current_user
from src.models.user import User
from src.schemas.common import ApiResponse
from src.schemas.cover_letter import (
    CoverLetterResponse,
    CoverLetterStartRequest,
    CoverLetterStartResponse,
)
from src.services import cover_letter_service

router = APIRouter(prefix="/cover-letter", tags=["cover-letter"])

CurrentUser = Annotated[User, Depends(get_current_user)]
DB = Annotated[AsyncSession, Depends(get_db)]


@router.post("/generate", response_model=ApiResponse[CoverLetterStartResponse])
async def generate(
    user: CurrentUser, db: DB, payload: CoverLetterStartRequest
) -> dict:
    task_id = await cover_letter_service.start(
        db, user, payload.resume_id, payload.jd_text
    )
    return {"success": True, "data": CoverLetterStartResponse(task_id=task_id)}


@router.get(
    "/result/{task_id}",
    response_model=ApiResponse[CoverLetterResponse],
)
async def get_result(user: CurrentUser, db: DB, task_id: str) -> dict:
    cover_letter = await cover_letter_service.get_result(db, user, task_id)
    return {
        "success": True,
        "data": CoverLetterResponse.model_validate(cover_letter),
    }
