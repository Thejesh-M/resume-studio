from fastapi import APIRouter, Header
from pydantic import BaseModel

from src.schemas.common import ApiResponse
from src.services import error_service

router = APIRouter(prefix="/error-reports", tags=["error-reports"])


class ErrorReportRequest(BaseModel):
    error_type: str
    message: str
    stack: str | None = None
    context: dict | None = None
    user_id: str | None = None  # client can pass their own uid for attribution


@router.post("", response_model=ApiResponse[None])
async def report_error(
    payload: ErrorReportRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    """Receive a frontend error report. No auth required — errors happen before auth."""
    error_service.report(
        error_type=payload.error_type,
        message=payload.message,
        stack=payload.stack,
        context=payload.context,
        user_id=payload.user_id,
    )
    return {"success": True, "data": None}
