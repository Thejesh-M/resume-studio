"""Generate preview assets (PNG + PDF) for every template variant.

For each ``{category}/{variant}`` on disk:
  * Compile the sample ``content.json`` via Typst.
  * Render page 1 as ``frontend/public/previews/{category}/{variant}.png``.
  * Render the full document as ``frontend/public/previews/{category}/{variant}.pdf``.
  * Update the template row's ``preview_url`` to ``/previews/{category}/{variant}.png``.
    (The PDF companion is derived on the frontend by swapping ``.png`` → ``.pdf``.)

Idempotent — variants that already have both PNG + PDF on disk are skipped.
Logs a warning and returns cleanly if the Typst CLI is missing, so the app
still boots on machines without Typst installed.

Usage:
    python -m scripts.gen_previews
"""

from __future__ import annotations

import asyncio
import logging
import shutil
import subprocess
import tempfile
from pathlib import Path

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import async_session
from src.models.template import Template

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
TEMPLATES_DIR = PROJECT_ROOT / "backend" / "templates"
PREVIEWS_DIR = PROJECT_ROOT / "frontend" / "public" / "previews"


def _has_typst() -> bool:
    return shutil.which("typst") is not None


def _compile_assets(category: str, variant: str) -> tuple[bytes | None, bytes | None]:
    """Render the variant's sample resume to (page-1 PNG, full PDF)."""
    template_dir = TEMPLATES_DIR / category / variant
    template_typ = template_dir / "template.typ"
    content_json = template_dir / "content.json"

    if not template_typ.exists() or not content_json.exists():
        return None, None

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        root = tmp / "root"
        root.mkdir()

        # Cross-template imports resolve against the Typst root, so we mirror
        # every category/variant + _shared/ under it.
        for cat_dir in TEMPLATES_DIR.iterdir():
            if not cat_dir.is_dir() or cat_dir.name.startswith("_"):
                continue
            for var_dir in cat_dir.iterdir():
                if var_dir.is_dir():
                    shutil.copytree(var_dir, root / cat_dir.name / var_dir.name)
        shutil.copytree(TEMPLATES_DIR / "_shared", root / "_shared")

        entry_source = (
            f'#import "/{category}/{variant}/template.typ": render, default-theme\n'
            '#let data = json("/content.json")\n'
            "#render(data, theme: default-theme)\n"
        )
        (root / "entry.typ").write_text(entry_source, encoding="utf-8")
        shutil.copy(content_json, root / "content.json")

        entry_path = root / "entry.typ"
        png_path = root / "preview.png"
        pdf_path = root / "preview.pdf"

        png_result = subprocess.run(
            [
                "typst", "compile",
                "--root", str(root),
                "--format", "png",
                "--pages", "1",
                str(entry_path),
                str(png_path),
            ],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if png_result.returncode != 0:
            logger.warning(
                "typst PNG failed for %s/%s: %s",
                category, variant, png_result.stderr.strip(),
            )

        pdf_result = subprocess.run(
            [
                "typst", "compile",
                "--root", str(root),
                "--format", "pdf",
                str(entry_path),
                str(pdf_path),
            ],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if pdf_result.returncode != 0:
            logger.warning(
                "typst PDF failed for %s/%s: %s",
                category, variant, pdf_result.stderr.strip(),
            )

        # Typst may emit either ``preview.png`` or ``preview_1.png``.
        png_bytes: bytes | None = None
        for candidate in (png_path, root / "preview_1.png"):
            if candidate.exists():
                png_bytes = candidate.read_bytes()
                break

        pdf_bytes = pdf_path.read_bytes() if pdf_path.exists() else None
        return png_bytes, pdf_bytes


def _discover_variants() -> list[tuple[str, str]]:
    pairs: list[tuple[str, str]] = []
    if not TEMPLATES_DIR.exists():
        return pairs
    for category_dir in sorted(TEMPLATES_DIR.iterdir()):
        if not category_dir.is_dir() or category_dir.name.startswith("_"):
            continue
        for variant_dir in sorted(category_dir.iterdir()):
            if variant_dir.is_dir() and (variant_dir / "template.typ").exists():
                pairs.append((category_dir.name, variant_dir.name))
    return pairs


async def _update_preview_url(db: AsyncSession, category: str, variant: str, url: str) -> None:
    await db.execute(
        update(Template)
        .where(Template.category == category, Template.variant == variant)
        .values(preview_url=url)
    )


async def generate(force: bool = False) -> dict[str, int]:
    """Generate any missing previews. Returns ``{"ok": n, "skipped": n, "failed": n}``."""
    counts = {"ok": 0, "skipped": 0, "failed": 0}

    if not _has_typst():
        logger.warning("typst CLI not found — skipping preview generation")
        return counts

    pairs = _discover_variants()
    PREVIEWS_DIR.mkdir(parents=True, exist_ok=True)

    async with async_session() as db:
        for category, variant in pairs:
            out_dir = PREVIEWS_DIR / category
            png_path = out_dir / f"{variant}.png"
            pdf_path = out_dir / f"{variant}.pdf"
            preview_url = f"/previews/{category}/{variant}.png"

            if png_path.exists() and pdf_path.exists() and not force:
                # Both assets on disk — still make sure the DB points at the PNG.
                await _update_preview_url(db, category, variant, preview_url)
                counts["skipped"] += 1
                continue

            logger.info("Rendering preview: %s/%s", category, variant)
            png_bytes, pdf_bytes = _compile_assets(category, variant)
            if png_bytes is None and pdf_bytes is None:
                counts["failed"] += 1
                continue

            out_dir.mkdir(parents=True, exist_ok=True)
            if png_bytes is not None:
                png_path.write_bytes(png_bytes)
            if pdf_bytes is not None:
                pdf_path.write_bytes(pdf_bytes)
            await _update_preview_url(db, category, variant, preview_url)
            counts["ok"] += 1

        await db.commit()

    return counts


async def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    result = await generate(force=False)
    logger.info("done — %d new, %d cached, %d failed", result["ok"], result["skipped"], result["failed"])


if __name__ == "__main__":
    asyncio.run(main())
