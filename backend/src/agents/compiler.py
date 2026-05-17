"""Compile resume content into a Typst PDF.

Layout:
    backend/templates/{category}/{variant}/template.typ   ← shared templates
    backend/templates/_shared/theme.typ                   ← helper module
    <storage_dir>/users/{uid}/resumes/{rid}/template/     ← optional per-resume
                                                            overrides (created by
                                                            ``copy_template_to_resume``)
"""

from __future__ import annotations

import json
import logging
import shutil
import subprocess
import tempfile
from pathlib import Path

from src.core.config import settings

logger = logging.getLogger(__name__)

TEMPLATES_DIR = Path(__file__).parent.parent.parent / "templates"
_STORAGE_ROOT = Path(settings.storage_dir)

_CATEGORY_DEFAULTS: dict[str, str] = {
    "classic": "classic-serif",
    "modern": "modern-blue",
    "two-column": "modern-resume",
    "academic": "academic-serif",
    "creative": "creative-purple",
    "modern-plain": "modern-plain",
    "classic-template-2": "template-2",
    "two-column-template-3": "template-3",
    "academic-template-2": "template-2",
    "classic-template-3": "template-3",
    "classic-template-4": "template-4",
    "modern-template-1": "template-1",
    "cover-letter": "template-1",
    "cover-letter-template-1": "template-1",
    "cover-letter-template-2": "template-2",
}


def _resolve_variant(template_id: str) -> str:
    parts = template_id.lower().split("/", 1)
    if len(parts) == 2:
        return f"{parts[0]}/{parts[1]}"
    category = parts[0]
    variant = _CATEGORY_DEFAULTS.get(category)
    if variant is None:
        logger.warning("Unknown template %r, falling back to classic/classic-serif", template_id)
        return "classic/classic-serif"
    return f"{category}/{variant}"


def _per_resume_template_dir(user_id: str, resume_id: str) -> Path | None:
    path = _STORAGE_ROOT / f"users/{user_id}/resumes/{resume_id}/template"
    return path if path.exists() else None


async def compile_typst(
    template_id: str,
    content: dict,
    theme_overrides: dict | None = None,
    user_id: str | None = None,
    resume_id: str | None = None,
) -> tuple[str, bytes]:
    """Compile ``content`` into a PDF using the given template.

    Returns ``(entry_typ_source, pdf_bytes)``.
    """
    use_overrides = bool(theme_overrides)
    variant_path = _resolve_variant(template_id)

    per_resume_dir = (
        _per_resume_template_dir(user_id, resume_id)
        if user_id and resume_id
        else None
    )

    template_source_dir = TEMPLATES_DIR / variant_path
    if not (template_source_dir / "template.typ").exists():
        raise RuntimeError(f"Template not found: {template_source_dir / 'template.typ'}")

    template_import_path = f"/{variant_path}/template.typ"

    if use_overrides:
        entry_source = (
            f'#import "{template_import_path}": render, default-theme\n'
            '#import "/_shared/theme.typ": resolve-theme\n'
            '#let data = json("/content.json")\n'
            '#let _overrides = json("/theme.json")\n'
            "#let theme = resolve-theme(default-theme, _overrides)\n"
            "#render(data, theme: theme)\n"
        )
    else:
        entry_source = (
            f'#import "{template_import_path}": render, default-theme\n'
            '#let data = json("/content.json")\n'
            "#render(data, theme: default-theme)\n"
        )

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)
        root = tmp / "root"
        root.mkdir()

        # Copy every shared variant under root so cross-template imports work.
        for cat_dir in TEMPLATES_DIR.iterdir():
            if not cat_dir.is_dir() or cat_dir.name.startswith("_"):
                continue
            for var_dir in cat_dir.iterdir():
                if var_dir.is_dir():
                    shutil.copytree(var_dir, root / cat_dir.name / var_dir.name)

        shutil.copytree(TEMPLATES_DIR / "_shared", root / "_shared")

        # Per-resume overrides overlay on top of the shared variant.
        if per_resume_dir is not None:
            cat, var = variant_path.split("/", 1)
            shutil.copytree(per_resume_dir, root / cat / var, dirs_exist_ok=True)

        (root / "content.json").write_text(
            json.dumps(content, ensure_ascii=False), encoding="utf-8"
        )
        if use_overrides:
            (root / "theme.json").write_text(
                json.dumps(theme_overrides, ensure_ascii=False), encoding="utf-8"
            )

        entry_path = root / "entry.typ"
        entry_path.write_text(entry_source, encoding="utf-8")
        pdf_path = root / "resume.pdf"

        result = subprocess.run(
            ["typst", "compile", "--root", str(root), str(entry_path), str(pdf_path)],
            capture_output=True,
            text=True,
            timeout=60,
        )

        if result.returncode != 0:
            logger.error("Typst compilation failed:\n%s", result.stderr)
            raise RuntimeError(f"Typst compilation failed: {result.stderr}")

        pdf_bytes = pdf_path.read_bytes()

    return entry_source, pdf_bytes
