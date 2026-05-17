from pydantic import BaseModel


class ApiResponse[T](BaseModel):
    success: bool
    data: T | None = None
    error: str | None = None
