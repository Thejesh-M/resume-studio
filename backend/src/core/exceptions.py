from fastapi import Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    """Base application error."""

    def __init__(self, message: str, status_code: int = 500, code: str | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


class NotFoundError(AppError):
    def __init__(self, resource: str = "Resource", resource_id: str = "") -> None:
        detail = (
            f"{resource} not found"
            if not resource_id
            else f"{resource} '{resource_id}' not found"
        )
        super().__init__(detail, status_code=404, code="not_found")


class ForbiddenError(AppError):
    def __init__(self, message: str = "You do not have access to this resource") -> None:
        super().__init__(message, status_code=403, code="forbidden")


class RateLimitError(AppError):
    def __init__(self, retry_after: int = 60) -> None:
        super().__init__(
            "Rate limit exceeded. Please try again later.",
            status_code=429,
            code="rate_limited",
        )
        self.retry_after = retry_after


class ValidationError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(message, status_code=400, code="validation_error")


async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "data": None,
            "error": exc.message,
            "code": exc.code,
        },
    )


async def unhandled_error_handler(_request: Request, _exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "data": None,
            "error": "An unexpected error occurred",
            "code": "internal_error",
        },
    )
