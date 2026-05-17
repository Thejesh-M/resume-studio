import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import NotFoundError
from src.models.template import Template


async def list_all(db: AsyncSession) -> list[Template]:
    """List all templates, free ones first."""
    result = await db.execute(
        select(Template).order_by(Template.is_premium, Template.name)
    )
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, template_id: uuid.UUID) -> Template:
    """Get a template by ID."""
    result = await db.execute(
        select(Template).where(Template.id == template_id)
    )
    template = result.scalar_one_or_none()
    if template is None:
        raise NotFoundError("Template", str(template_id))
    return template
