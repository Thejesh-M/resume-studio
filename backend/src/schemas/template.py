from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    category: str
    variant: str
    preview_url: str | None = None
    engine: str
    is_premium: bool
    is_ats_tested: bool
    created_at: datetime
