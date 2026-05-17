"""Populate the ``templates`` table from the files in ``backend/templates/``.

Scans every ``{category}/{variant}/template.typ`` and inserts one row per
variant, using a deterministic UUID derived from ``category/variant`` so reruns
are idempotent. Safe to call on every startup.

Usage:
    python -m scripts.seed_templates
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import async_session
from src.models.template import Template

logger = logging.getLogger(__name__)

TEMPLATES_ROOT = Path(__file__).resolve().parent.parent / "templates"

# Deterministic UUID namespace so the same template always gets the same id.
_NS = uuid.UUID("3d8c8e8a-1234-5678-9abc-def012345678")


def _humanize(text: str) -> str:
    """Convert a slug to a display name: ``classic-serif`` → ``Classic Serif``."""
    return " ".join(w.capitalize() for w in text.replace("_", "-").split("-"))


def _scan_templates() -> list[dict]:
    """Return a row dict per ``{category}/{variant}/template.typ`` on disk."""
    rows: list[dict] = []
    if not TEMPLATES_ROOT.exists():
        logger.warning("Template root not found: %s", TEMPLATES_ROOT)
        return rows

    for category_dir in sorted(TEMPLATES_ROOT.iterdir()):
        if not category_dir.is_dir() or category_dir.name.startswith("_"):
            continue
        category = category_dir.name
        for variant_dir in sorted(category_dir.iterdir()):
            if not variant_dir.is_dir():
                continue
            if not (variant_dir / "template.typ").exists():
                continue
            variant = variant_dir.name
            slug = f"{category}/{variant}"
            rows.append(
                {
                    "id": uuid.uuid5(_NS, slug),
                    "name": f"{_humanize(category)} — {_humanize(variant)}",
                    "category": category,
                    "variant": variant,
                    "preview_url": "",
                    "engine": "typst",
                    "is_premium": False,
                    "is_ats_tested": True,
                }
            )
    return rows


async def seed(db: AsyncSession) -> int:
    """Insert any templates that aren't already in the table. Returns count added."""
    rows = _scan_templates()
    added = 0
    for row in rows:
        existing = await db.execute(select(Template).where(Template.id == row["id"]))
        if existing.scalar_one_or_none() is not None:
            continue
        db.add(Template(**row))
        added += 1
    if added:
        await db.commit()
    return added


async def main() -> None:
    logging.basicConfig(level=logging.INFO)
    async with async_session() as db:
        added = await seed(db)
    logger.info("Templates seeded: %d new (out of %d on disk).", added, len(_scan_templates()))


if __name__ == "__main__":
    asyncio.run(main())
