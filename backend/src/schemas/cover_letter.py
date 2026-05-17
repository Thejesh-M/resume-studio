from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CoverLetterStartRequest(BaseModel):
    resume_id: UUID
    jd_text: str


class CoverLetterStartResponse(BaseModel):
    task_id: str


class CoverLetterContent(BaseModel):
    subject_line: str
    salutation: str
    body: str
    closing: str


class CoverLetterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    resume_id: UUID
    jd_id: UUID | None
    status: str
    content: str | None  # raw JSON string stored in DB; parsed client-side
    credits_used: int
    created_at: datetime
