"""Template File Service — read, write, and AI-edit per-resume template files.

All operations work on the per-resume template copy at
    users/{uid}/resumes/{rid}/template/

If the copy doesn't exist yet (legacy resumes created before the copy-on-create
flow), we lazily create it from the shared template before any read/write.
"""

from __future__ import annotations

import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import NotFoundError, ValidationError
from src.core.storage import (
    copy_template_to_resume,
    download_text,
    list_files,
    make_resume_template_path,
    upload_text,
)
from src.models.resume import UserResume
from src.models.template import Template
from src.models.user import User

logger = logging.getLogger(__name__)

# Only allow editing these file types — blocks binary / asset overwrites
_EDITABLE_EXTENSIONS = {".typ", ".json"}

# Maximum file size the AI agent will process (to stay within LLM context)
_MAX_AGENT_FILE_SIZE = 64_000  # ~64 KB


async def _get_resume(
    db: AsyncSession, user: User, resume_id: uuid.UUID
) -> UserResume:
    result = await db.execute(
        select(UserResume).where(
            UserResume.id == resume_id, UserResume.user_id == user.id
        )
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise NotFoundError("Resume not found")
    return resume


async def _ensure_template_copy(
    db: AsyncSession, user: User, resume: UserResume
) -> None:
    """Ensure the per-resume template/ folder exists, copying from shared if needed."""
    uid = str(user.id)
    rid = str(resume.id)
    prefix = f"users/{uid}/resumes/{rid}/template"

    existing = await list_files(prefix)
    if existing:
        return  # already has files

    # Resolve the template category/variant
    tmpl_result = await db.execute(
        select(Template).where(Template.id == resume.template_id)
    )
    template = tmpl_result.scalar_one_or_none()
    if not template:
        raise ValidationError(
            "Cannot initialise template files — template not found in DB."
        )

    logger.info(
        "Lazy-copying template %s/%s → resume %s",
        template.category,
        template.variant,
        resume.id,
    )
    await copy_template_to_resume(
        uid, rid, template.category, template.variant or template.category
    )


def _template_prefix(user: User, resume_id: uuid.UUID) -> str:
    return f"users/{user.id}/resumes/{resume_id}/template"


# ── Public API ───────────────────────────────────────────────────────────────


async def list_template_files(
    db: AsyncSession, user: User, resume_id: uuid.UUID
) -> list[dict]:
    """Return [{path, size}] for all files in the per-resume template folder."""
    resume = await _get_resume(db, user, resume_id)
    await _ensure_template_copy(db, user, resume)

    prefix = _template_prefix(user, resume_id)
    paths = await list_files(prefix)

    entries: list[dict] = []
    for p in paths:
        # Get size by downloading (for text files) or approximating
        full_path = make_resume_template_path(str(user.id), str(resume_id), p)
        try:
            raw = await download_text(full_path)
            entries.append({"path": p, "size": len(raw.encode("utf-8"))})
        except Exception:
            # Binary file or read error — report size 0
            entries.append({"path": p, "size": 0})

    return entries


async def read_template_file(
    db: AsyncSession, user: User, resume_id: uuid.UUID, file_path: str
) -> str:
    """Read a single file from the per-resume template folder."""
    resume = await _get_resume(db, user, resume_id)
    await _ensure_template_copy(db, user, resume)

    full_path = make_resume_template_path(str(user.id), str(resume_id), file_path)
    try:
        return await download_text(full_path)
    except FileNotFoundError:
        raise NotFoundError(f"Template file not found: {file_path}")
    except Exception as e:
        raise ValidationError(f"Cannot read file: {e}")


async def write_template_file(
    db: AsyncSession,
    user: User,
    resume_id: uuid.UUID,
    file_path: str,
    content: str,
) -> None:
    """Write (overwrite) a file in the per-resume template folder.

    Only .typ and .json files can be written (no binary overwrites).
    """
    resume = await _get_resume(db, user, resume_id)
    await _ensure_template_copy(db, user, resume)

    # Validate extension
    ext = "." + file_path.rsplit(".", 1)[-1] if "." in file_path else ""
    if ext not in _EDITABLE_EXTENSIONS:
        raise ValidationError(
            f"Only {', '.join(sorted(_EDITABLE_EXTENSIONS))} files can be edited."
        )

    # Block path traversal
    if ".." in file_path or file_path.startswith("/"):
        raise ValidationError("Invalid file path.")

    full_path = make_resume_template_path(str(user.id), str(resume_id), file_path)
    await upload_text(full_path, content)
    logger.info("Wrote template file %s for resume %s", file_path, resume_id)


async def reset_template(
    db: AsyncSession, user: User, resume_id: uuid.UUID
) -> None:
    """Re-copy the shared template to the per-resume template/ folder.

    This replaces all per-resume template files with the latest shared version,
    discarding any user customizations.
    """
    resume = await _get_resume(db, user, resume_id)

    tmpl_result = await db.execute(
        select(Template).where(Template.id == resume.template_id)
    )
    template = tmpl_result.scalar_one_or_none()
    if not template:
        raise ValidationError("Cannot reset — template not found in DB.")

    await copy_template_to_resume(
        str(user.id),
        str(resume_id),
        template.category,
        template.variant or template.category,
    )
    logger.info("Reset template for resume %s to %s/%s", resume_id, template.category, template.variant)


async def ai_edit_template(
    db: AsyncSession,
    user: User,
    resume_id: uuid.UUID,
    message: str,
    target_file: str | None = None,
) -> dict:
    """Use the AI agent to edit template files based on a natural-language instruction.

    Returns {reply: str, changes: [{file_path, content}]}.
    Changes are also persisted to storage automatically.
    """
    from src.agents import template_editor_agent

    resume = await _get_resume(db, user, resume_id)
    await _ensure_template_copy(db, user, resume)

    # Read all editable files to give the agent full context
    prefix = _template_prefix(user, resume_id)
    all_paths = await list_files(prefix)

    files: dict[str, str] = {}
    for p in all_paths:
        ext = "." + p.rsplit(".", 1)[-1] if "." in p else ""
        if ext not in _EDITABLE_EXTENSIONS:
            continue  # skip binary assets
        full_path = make_resume_template_path(str(user.id), str(resume_id), p)
        try:
            text = await download_text(full_path)
            if len(text) <= _MAX_AGENT_FILE_SIZE:
                files[p] = text
        except Exception:
            pass  # skip unreadable files

    if not files:
        raise ValidationError("No editable template files found.")

    # Call the AI agent
    result = await template_editor_agent.edit_template(
        message=message,
        files=files,
        target_file=target_file,
    )

    changes = result.get("changes", [])
    if not changes:
        return result

    # Save originals so we can revert if compilation breaks
    originals: dict[str, str] = {}
    for change in changes:
        fp = change["file_path"]
        if fp in files:
            originals[fp] = files[fp]

    # Persist changes to storage
    written_paths: list[str] = []
    for change in changes:
        fp = change["file_path"]
        content = change["content"]

        ext = "." + fp.rsplit(".", 1)[-1] if "." in fp else ""
        if ext not in _EDITABLE_EXTENSIONS:
            continue
        if ".." in fp or fp.startswith("/"):
            continue

        full_path = make_resume_template_path(str(user.id), str(resume_id), fp)
        await upload_text(full_path, content)
        written_paths.append(fp)
        logger.info("AI edit: wrote %s for resume %s", fp, resume_id)

    # ── Compile check: revert if the edit broke the template ─────────
    try:
        from src.agents.compiler import compile_typst

        tmpl_result = await db.execute(
            select(Template).where(Template.id == resume.template_id)
        )
        template = tmpl_result.scalar_one_or_none()
        template_slug = (
            f"{template.category}/{template.variant}"
            if template
            else "classic/classic-serif"
        )

        # Use minimal content for a quick compile check
        test_content = resume.content if resume.content else {"contact": {"name": "", "email": ""}}
        await compile_typst(
            template_id=template_slug,
            content=dict(test_content),
            user_id=str(user.id),
            resume_id=str(resume_id),
        )
        logger.info("AI edit compile check passed for resume %s", resume_id)
    except Exception as compile_err:
        # Revert all changes
        logger.warning(
            "AI edit broke compilation for resume %s, reverting: %s",
            resume_id,
            compile_err,
        )
        for fp in written_paths:
            if fp in originals:
                full_path = make_resume_template_path(
                    str(user.id), str(resume_id), fp
                )
                await upload_text(full_path, originals[fp])
                logger.info("Reverted %s for resume %s", fp, resume_id)

        return {
            "reply": (
                "Sorry, that change didn't work — I've reverted it so your "
                "resume is unchanged. Could you try describing the change "
                "differently? For example: \"make headings red\" or "
                "\"increase margins to 2cm\"."
            ),
            "changes": [],
        }

    return result
