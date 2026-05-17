import io
import json
import logging
import uuid

from fastapi import UploadFile
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import ForbiddenError, NotFoundError, ValidationError
from src.core.storage import (
    copy_template_to_resume,
    make_extraction_path,
    make_resume_path,
    make_resume_upload_path,
    make_temp_extraction_path,
    make_temp_upload_path,
    make_theme_path,
    move_file,
    upload_bytes,
)
from src.models.resume import UserResume
from src.models.user import User
from src.schemas.resume import (
    ExtractionResult,
    ResumeContent,
    ResumeCreateRequest,
    ResumeUpdateRequest,
    TemplateSwitchRequest,
    ThemeOverrides,
)

logger = logging.getLogger(__name__)

ALLOWED_TYPES = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


async def extract_from_file(user: User, file: UploadFile) -> ExtractionResult:
    """Extract structured content from an uploaded PDF or DOCX file.

    Uploads the original file to a temporary storage path, runs LLM extraction,
    uploads the extraction snapshot, and returns the parsed content together
    with an extraction_id so the frontend can pass it back when confirming.
    """
    # Validate file type
    content_type = file.content_type or ""
    if content_type not in ALLOWED_TYPES:
        raise ValidationError(
            f"Unsupported file type: {content_type}. "
            "Please upload a PDF or DOCX file."
        )

    # Read and validate size
    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise ValidationError(
            f"File too large ({len(data) / 1024 / 1024:.1f} MB). "
            f"Maximum size is {MAX_FILE_SIZE / 1024 / 1024:.0f} MB."
        )

    extraction_id = uuid.uuid4().hex
    filename = file.filename or f"upload{ALLOWED_TYPES[content_type]}"

    # Upload original to temp storage path
    upload_path = make_temp_upload_path(str(user.id), extraction_id, filename)
    await upload_bytes(upload_path, data, content_type)

    # Extract structured content via Gemini 2.5 Flash
    # PDF  → raw bytes sent directly to Gemini Files API (handles layout/columns natively)
    # DOCX → text extracted via python-docx, then sent as a text prompt
    from src.agents import resume_extractor

    if content_type == "application/pdf":
        llm_result = await resume_extractor.extract_from_pdf(data)
        raw_text_fallback = _text_from_pdf_safe(data)
    else:
        raw_text_fallback = _text_from_docx(data)
        llm_result = await resume_extractor.extract_from_docx_text(raw_text_fallback)

    if llm_result is not None:
        try:
            content = ResumeContent.model_validate(llm_result)
        except Exception:
            logger.exception("LLM extraction result failed schema validation; using heuristic fallback")
            content = _heuristic_parse(raw_text_fallback)
    else:
        logger.warning("LLM extraction returned None after all retries; using heuristic fallback")
        content = _heuristic_parse(raw_text_fallback)

    # Upload extraction snapshot to temp storage path
    extraction_path = make_temp_extraction_path(str(user.id), extraction_id)
    snapshot = json.dumps(content.model_dump(), indent=2, ensure_ascii=False).encode()
    await upload_bytes(extraction_path, snapshot, "application/json")

    return ExtractionResult(content=content, extraction_id=extraction_id)


def _text_from_pdf_safe(data: bytes) -> str:
    """Extract plain text from a PDF for use in the heuristic fallback only.

    Gemini handles the primary extraction path natively (including scanned PDFs).
    This function is only called when the LLM extraction fails entirely.
    Returns an empty string rather than raising if the PDF has no selectable text.
    """
    try:
        import pymupdf

        doc = pymupdf.open(stream=data, filetype="pdf")
        pages_text: list[str] = []
        for page in doc:
            blocks = page.get_text("blocks")
            page_text = "\n".join(b[4] for b in blocks if isinstance(b[4], str))
            pages_text.append(page_text)
        doc.close()
        return "\n".join(pages_text)
    except Exception:
        logger.warning("pymupdf fallback text extraction failed — heuristic will receive empty string")
        return ""


def _text_from_docx(data: bytes) -> str:
    """Extract plain text from a DOCX, including table cells."""
    from docx import Document

    doc = Document(io.BytesIO(data))
    parts: list[str] = [p.text for p in doc.paragraphs if p.text.strip()]

    # Capture skills/experience that may live in tables
    for table in doc.tables:
        for row in table.rows:
            row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
            if row_text:
                parts.append(row_text)

    return "\n".join(parts)


def _heuristic_parse(text: str) -> ResumeContent:
    """Minimal rule-based fallback parser.

    Used only when the LLM is unavailable or returns invalid data.
    Extracts name, email, phone, and linkedin from the first ~10 lines.
    """
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    name = lines[0] if lines else "Unknown"

    email = ""
    phone = None
    linkedin = None
    for line in lines[:10]:
        if "@" in line and "." in line and not email:
            for word in line.split():
                if "@" in word:
                    email = word.strip("(),<>")
                    break
        if not phone and any(c in line for c in ["(", "+", "tel", "Tel"]):
            phone = line
        if not linkedin and "linkedin" in line.lower():
            linkedin = line

    return ResumeContent(
        contact={"name": name, "email": email, "phone": phone, "linkedin": linkedin},
        summary="",
        experience=[],
        education=[],
        skills=[],
    )


# --- CRUD Operations ---


async def create(
    db: AsyncSession, user: User, payload: ResumeCreateRequest
) -> UserResume:
    """Create a new resume. First resume is automatically set as default.

    Steps:
    1. Copies the chosen template variant into the resume's storage folder.
    2. If an extraction_id is provided, promotes the temp storage files
       (raw upload + extraction snapshot) from the staging area to the
       permanent per-resume paths and records those paths on the model.
    """
    from src.models.template import Template

    # Resolve template category + variant for the storage copy
    tmpl_result = await db.execute(
        select(Template).where(Template.id == payload.template_id)
    )
    template = tmpl_result.scalar_one_or_none()

    # Check if this is the user's first resume (→ set as default)
    count_result = await db.execute(
        select(UserResume).where(UserResume.user_id == user.id).limit(1)
    )
    is_first = count_result.scalar_one_or_none() is None

    resume_id = uuid.uuid4()
    uid = str(user.id)
    rid = str(resume_id)

    # ── 1. Copy template files to per-resume folder ───────────────────────────
    if template:
        try:
            await copy_template_to_resume(
                uid,
                rid,
                template.category,
                template.variant or template.category,
            )
        except Exception:
            logger.exception(
                "Failed to copy template %s to resume %s — resume will still be created",
                payload.template_id,
                resume_id,
            )

    # ── 2. Promote temp storage files → final resume paths ────────────────────────
    final_upload_path: str | None = None
    final_extraction_path: str | None = None

    if payload.extraction_id:
        eid = payload.extraction_id

        # Determine the file extension from the temp upload (try both PDF and DOCX)
        for ext in (".pdf", ".docx"):
            temp_upload = make_temp_upload_path(uid, eid, f"raw{ext}")
            final_upload = make_resume_upload_path(uid, rid, f"upload{ext}")
            try:
                await move_file(temp_upload, final_upload)
                final_upload_path = final_upload
                break
            except Exception:
                # This extension didn't exist — try the next one
                pass

        # Move extraction snapshot
        temp_extraction = make_temp_extraction_path(uid, eid)
        final_extraction = make_extraction_path(uid, rid)
        try:
            await move_file(temp_extraction, final_extraction)
            final_extraction_path = final_extraction
        except Exception:
            logger.exception(
                "Failed to move extraction snapshot for resume %s — "
                "original_extraction_path will be null",
                resume_id,
            )

        if not final_upload_path:
            logger.warning(
                "No temp upload file found for extraction_id=%s — "
                "original_upload_path will be null",
                eid,
            )

    # ── 3. Compile template → PDF ─────────────────────────────────────────────
    base_pdf_storage_path: str | None = None
    template_id_str = str(payload.template_id)

    try:
        from src.agents.compiler import compile_typst

        _, pdf_bytes = await compile_typst(
            template_id=f"{template.category}/{template.variant}" if template else template_id_str,
            content=payload.content.model_dump(),
            user_id=uid,
            resume_id=rid,
        )
        pdf_path = make_resume_path(uid, rid, "base.pdf")
        await upload_bytes(pdf_path, pdf_bytes, "application/pdf")
        base_pdf_storage_path = pdf_path
        logger.info("Compiled and stored PDF for resume %s", resume_id)
    except Exception:
        logger.exception(
            "Failed to compile resume %s on creation — base_pdf_url will be null",
            resume_id,
        )

    # ── 4. Insert DB row ──────────────────────────────────────────────────────
    resume = UserResume(
        id=resume_id,
        user_id=user.id,
        title=payload.title,
        template_id=payload.template_id,
        content=payload.content.model_dump(),
        is_default=is_first,
        original_upload_path=final_upload_path,
        extraction_path=final_extraction_path,
        base_pdf_url=base_pdf_storage_path,
    )
    db.add(resume)
    await db.flush()
    await db.refresh(resume)
    return resume


async def update_theme(
    db: AsyncSession,
    user: User,
    resume_id: uuid.UUID,
    overrides: ThemeOverrides,
) -> UserResume:
    """Persist theme overrides for a resume.

    Writes the delta dict to storage theme.json and mirrors it in the DB
    theme_overrides column so the API can read it without a storage round-trip.
    """
    resume = await get_by_id(db, user, resume_id)

    typst_dict = overrides.to_typst_dict()

    # Write to storage
    theme_path = make_theme_path(str(user.id), str(resume_id))
    theme_bytes = json.dumps(typst_dict, indent=2, ensure_ascii=False).encode()
    await upload_bytes(theme_path, theme_bytes, "application/json")

    # Mirror in DB
    resume.theme_overrides = typst_dict or None
    db.add(resume)
    await db.flush()
    await db.refresh(resume)
    return resume


async def switch_template(
    db: AsyncSession,
    user: User,
    resume_id: uuid.UUID,
    payload: TemplateSwitchRequest,
) -> UserResume:
    """Switch the template used by a resume.

    Copies the new template variant into the resume's storage template/ folder
    (replacing the previous copy), then updates the template_id in the DB.
    """
    from src.models.template import Template

    resume = await get_by_id(db, user, resume_id)

    tmpl_result = await db.execute(
        select(Template).where(Template.id == payload.template_id)
    )
    template = tmpl_result.scalar_one_or_none()
    if template is None:
        raise NotFoundError("Template", str(payload.template_id))

    await copy_template_to_resume(
        str(user.id),
        str(resume_id),
        template.category,
        template.variant or template.category,
    )

    resume.template_id = payload.template_id
    db.add(resume)
    await db.flush()
    await db.refresh(resume)
    return resume


async def list_for_user(db: AsyncSession, user: User) -> list[UserResume]:
    """List all resumes for a user, default first."""
    result = await db.execute(
        select(UserResume)
        .where(UserResume.user_id == user.id)
        .order_by(UserResume.is_default.desc(), UserResume.updated_at.desc())
    )
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, user: User, resume_id: uuid.UUID) -> UserResume:
    """Get a resume by ID with ownership check."""
    result = await db.execute(
        select(UserResume).where(UserResume.id == resume_id)
    )
    resume = result.scalar_one_or_none()
    if resume is None:
        raise NotFoundError("Resume", str(resume_id))
    if resume.user_id != user.id:
        raise ForbiddenError()
    return resume


async def update_resume(
    db: AsyncSession,
    user: User,
    resume_id: uuid.UUID,
    payload: ResumeUpdateRequest,
) -> UserResume:
    """Update a resume. Only provided fields are changed."""
    resume = await get_by_id(db, user, resume_id)

    update_data = payload.model_dump(exclude_unset=True)

    # Handle is_default toggle — unset others first
    if update_data.get("is_default") is True:
        await db.execute(
            update(UserResume)
            .where(UserResume.user_id == user.id, UserResume.id != resume_id)
            .values(is_default=False)
        )

    # Serialize content if provided
    if "content" in update_data and update_data["content"] is not None:
        update_data["content"] = payload.content.model_dump()

    for field, value in update_data.items():
        setattr(resume, field, value)

    db.add(resume)
    await db.flush()
    await db.refresh(resume)
    return resume


async def delete(db: AsyncSession, user: User, resume_id: uuid.UUID) -> None:
    """Delete a resume with ownership check."""
    resume = await get_by_id(db, user, resume_id)
    await db.delete(resume)
    await db.flush()


async def copy_resume(
    db: AsyncSession, user: User, source_id: uuid.UUID, new_title: str
) -> UserResume:
    """Duplicate an existing resume — structured or raw.

    For raw uploads, the stored PDF is cloned into a new storage path so each row
    owns its own blob. For structured resumes, content/template/theme are
    copied and a fresh base.pdf is compiled.
    """
    source = await get_by_id(db, user, source_id)  # already enforces ownership

    new_id = uuid.uuid4()
    new_pdf_path: str | None = None

    if source.base_pdf_url:
        # Clone the stored PDF so deleting the source doesn't kill the copy.
        from src.core.storage import download_bytes

        try:
            pdf_bytes = await download_bytes(source.base_pdf_url)
            new_pdf_path = make_resume_path(str(user.id), str(new_id), "base.pdf")
            await upload_bytes(new_pdf_path, pdf_bytes, "application/pdf")
        except Exception:
            logger.exception(
                "Failed to clone PDF for resume %s — copy will have no base PDF",
                source.id,
            )
            new_pdf_path = None

    copy = UserResume(
        id=new_id,
        user_id=user.id,
        title=new_title,
        template_id=source.template_id,
        content=dict(source.content) if source.content else None,
        theme_overrides=dict(source.theme_overrides) if source.theme_overrides else None,
        is_default=False,
        is_raw_upload=source.is_raw_upload,
        base_pdf_url=new_pdf_path,
    )
    db.add(copy)
    await db.flush()
    await db.refresh(copy)
    return copy


async def create_raw_pdf_resume(
    db: AsyncSession,
    user: User,
    title: str,
    file: UploadFile,
) -> UserResume:
    """Create a resume row directly from an uploaded PDF — no extraction.

    The PDF is stored as `base.pdf` in the user's resume folder. Auto-apply
    will submit this file unchanged, bypassing the tailoring pipeline.
    """
    content_type = file.content_type or ""
    if content_type != "application/pdf":
        raise ValidationError("Raw upload only accepts PDF files.")

    data = await file.read()
    if not data:
        raise ValidationError("Uploaded file is empty.")
    if len(data) > MAX_FILE_SIZE:
        raise ValidationError(
            f"File too large ({len(data) / 1024 / 1024:.1f} MB). "
            f"Maximum size is {MAX_FILE_SIZE / 1024 / 1024:.0f} MB."
        )

    clean_title = (title or "").strip()
    if not clean_title:
        raise ValidationError("Resume title is required.")

    # Make it the default if the user has no resumes yet.
    existing = await db.execute(
        select(UserResume.id).where(UserResume.user_id == user.id).limit(1)
    )
    is_first = existing.first() is None

    resume_id = uuid.uuid4()
    pdf_path = make_resume_path(str(user.id), str(resume_id), "base.pdf")
    await upload_bytes(pdf_path, data, "application/pdf")

    resume = UserResume(
        id=resume_id,
        user_id=user.id,
        title=clean_title,
        template_id=None,
        content=None,
        is_default=is_first,
        is_raw_upload=True,
        base_pdf_url=pdf_path,
        original_upload_path=pdf_path,
    )
    db.add(resume)
    await db.flush()
    await db.refresh(resume)
    return resume
