from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.schemas.common import ApiResponse
from src.schemas.template import TemplateResponse
from src.services import template_service

router = APIRouter(prefix="/templates", tags=["templates"])

DB = Annotated[AsyncSession, Depends(get_db)]


@router.get("", response_model=ApiResponse[list[TemplateResponse]])
async def list_templates(db: DB) -> dict:
    """List all available templates."""
    templates = await template_service.list_all(db)
    return {
        "success": True,
        "data": [TemplateResponse.model_validate(t) for t in templates],
    }


@router.get("/{template_id}", response_model=ApiResponse[TemplateResponse])
async def get_template(db: DB, template_id: UUID) -> dict:
    """Get a single template by ID."""
    template = await template_service.get_by_id(db, template_id)
    return {"success": True, "data": TemplateResponse.model_validate(template)}
