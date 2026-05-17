from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Form, Response, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.security import get_current_user
from src.models.user import User
from src.schemas.common import ApiResponse
from src.schemas.resume import (
    ChatRequest,
    ChatResponse,
    CompileRequest,
    ExtractionResult,
    ResumeCreateRequest,
    ResumeResponse,
    ResumeUpdateRequest,
    TemplateSwitchRequest,
    ThemeOverrides,
)
from src.schemas.template_editor import (
    TemplateEditRequest,
    TemplateEditResponse,
    TemplateFileContent,
    TemplateFileListResponse,
    TemplateFileWriteRequest,
)
from src.services import resume_service
from src.services import template_file_service

router = APIRouter(prefix="/resumes", tags=["resumes"])

CurrentUser = Annotated[User, Depends(get_current_user)]
DB = Annotated[AsyncSession, Depends(get_db)]


@router.post("/extract", response_model=ApiResponse[ExtractionResult])
async def extract_resume(user: CurrentUser, file: UploadFile) -> dict:
    """Upload a PDF/DOCX and extract structured resume content.

    Returns the parsed content plus an extraction_id that the frontend must
    pass back when calling POST /resumes to link the temp storage files to the
    newly created resume.
    """
    result = await resume_service.extract_from_file(user, file)
    return {"success": True, "data": result}


@router.post("", response_model=ApiResponse[ResumeResponse], status_code=201)
async def create_resume(
    user: CurrentUser, db: DB, payload: ResumeCreateRequest
) -> dict:
    """Create a new resume from extracted content."""
    resume = await resume_service.create(db, user, payload)
    return {"success": True, "data": ResumeResponse.from_orm_model(resume)}


@router.post(
    "/raw-upload",
    response_model=ApiResponse[ResumeResponse],
    status_code=201,
)
async def upload_raw_resume(
    user: CurrentUser,
    db: DB,
    file: UploadFile,
    title: str = Form(...),
) -> dict:
    """Upload a PDF directly as a resume — no extraction, no template.

    Intended for users who already have a polished resume and just want to
    store it for submissions. Auto-apply will attach this PDF unchanged.
    """
    resume = await resume_service.create_raw_pdf_resume(db, user, title, file)
    return {"success": True, "data": ResumeResponse.from_orm_model(resume)}


@router.get("", response_model=ApiResponse[list[ResumeResponse]])
async def list_resumes(user: CurrentUser, db: DB) -> dict:
    """List all resumes for the current user."""
    resumes = await resume_service.list_for_user(db, user)
    return {
        "success": True,
        "data": [ResumeResponse.from_orm_model(r) for r in resumes],
    }


@router.get("/{resume_id}", response_model=ApiResponse[ResumeResponse])
async def get_resume(user: CurrentUser, db: DB, resume_id: UUID) -> dict:
    """Get a single resume by ID."""
    resume = await resume_service.get_by_id(db, user, resume_id)
    return {"success": True, "data": ResumeResponse.from_orm_model(resume)}


@router.patch("/{resume_id}", response_model=ApiResponse[ResumeResponse])
async def update_resume(
    user: CurrentUser, db: DB, resume_id: UUID, payload: ResumeUpdateRequest
) -> dict:
    """Update a resume (partial update)."""
    resume = await resume_service.update_resume(db, user, resume_id, payload)
    return {"success": True, "data": ResumeResponse.from_orm_model(resume)}


@router.post(
    "/{resume_id}/copy",
    response_model=ApiResponse[ResumeResponse],
    status_code=201,
)
async def copy_resume_endpoint(
    user: CurrentUser,
    db: DB,
    resume_id: UUID,
    title: str | None = Form(None),
) -> dict:
    """Duplicate a resume (structured or raw PDF).

    Defaults the copy's title to "Copy of <source title>" when not provided.
    """
    source = await resume_service.get_by_id(db, user, resume_id)
    new_title = (title or f"Copy of {source.title}").strip() or "Untitled copy"
    copy = await resume_service.copy_resume(db, user, resume_id, new_title)
    return {"success": True, "data": ResumeResponse.from_orm_model(copy)}


@router.delete("/{resume_id}", status_code=204)
async def delete_resume(user: CurrentUser, db: DB, resume_id: UUID) -> None:
    """Delete a resume."""
    await resume_service.delete(db, user, resume_id)


@router.patch("/{resume_id}/theme", response_model=ApiResponse[ResumeResponse])
async def update_theme(
    user: CurrentUser, db: DB, resume_id: UUID, payload: ThemeOverrides
) -> dict:
    """Save theme overrides for a resume.

    Writes to storage theme.json and mirrors in the DB theme_overrides column.
    Pass an empty body {} to clear all overrides.
    """
    resume = await resume_service.update_theme(db, user, resume_id, payload)
    return {"success": True, "data": ResumeResponse.from_orm_model(resume)}


@router.patch("/{resume_id}/template", response_model=ApiResponse[ResumeResponse])
async def switch_template(
    user: CurrentUser, db: DB, resume_id: UUID, payload: TemplateSwitchRequest
) -> dict:
    """Switch the template used by a resume.

    Copies the new template variant into the resume's storage template/ folder,
    replacing the previous copy, and updates template_id in the DB.
    """
    resume = await resume_service.switch_template(db, user, resume_id, payload)
    return {"success": True, "data": ResumeResponse.from_orm_model(resume)}


@router.post("/{resume_id}/compile")
async def compile_resume(
    user: CurrentUser, db: DB, resume_id: UUID, payload: CompileRequest
) -> Response:
    """Compile a resume to PDF using the current or provided content.

    Returns raw PDF bytes with content-type application/pdf.
    If payload.content is None, uses the saved resume content.
    """
    from src.agents.compiler import compile_typst

    from sqlalchemy import select
    from src.models.template import Template

    resume = await resume_service.get_by_id(db, user, resume_id)
    content_dict = (
        payload.content.model_dump() if payload.content else resume.content
    )
    theme = resume.theme_overrides or None

    # Resolve category/variant slug so the compiler can locate the template dir
    tmpl_result = await db.execute(select(Template).where(Template.id == resume.template_id))
    template = tmpl_result.scalar_one_or_none()
    template_slug = (
        f"{template.category}/{template.variant}" if template else str(resume.template_id)
    )

    _, pdf_bytes = await compile_typst(
        template_slug,
        content_dict,
        theme_overrides=theme,
        user_id=str(user.id),
        resume_id=str(resume_id),
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "inline; filename=resume.pdf"},
    )


async def _classify_chat_intent(message: str) -> str:
    """Classify whether a chat message is about content, template styling,
    or section reordering.

    Returns "content", "template", or "reorder".
    """
    msg = message.lower()

    # ── Section reordering ──
    _REORDER_PATTERNS = [
        "move section", "move the section", "reorder section", "reorder the section",
        "swap section", "swap the section", "rearrange section", "rearrange the section",
        "move experience", "move education", "move skills", "move projects",
        "move summary", "move certifications", "move awards", "move publications",
        "move languages", "move interests", "move volunteers", "move references",
        "put experience", "put education", "put skills", "put projects",
        "section before", "section after", "section above", "section below",
        "move up", "move down", "drag section", "drag the section",
        "change section order", "change the order", "reorder",
        "experience before education", "education before experience",
        "skills first", "skills at the top", "experience first",
        "section up", "section down",
    ]
    for pattern in _REORDER_PATTERNS:
        if pattern in msg:
            return "reorder"

    # ── Template styling ──
    _TEMPLATE_KEYWORDS = {
        "color", "colour", "font", "margin", "spacing", "layout", "heading style",
        "accent", "theme", "bold heading", "italic heading", "size", "bigger",
        "smaller", "indent", "padding", "border", "typst", "template",
        "page size", "line spacing", "section spacing", "two column", "two-column",
        "sidebar", "header style", "footer", "page margin", "column",
    }
    _TEMPLATE_PATTERNS = [
        "make heading", "make the heading", "change heading",
        "make title", "change the color", "change color", "change the font",
        "change font", "make it blue", "make it red", "make it green",
        "increase margin", "decrease margin", "increase spacing", "decrease spacing",
        "make section", "change the style", "change style",
    ]

    for pattern in _TEMPLATE_PATTERNS:
        if pattern in msg:
            return "template"

    for kw in _TEMPLATE_KEYWORDS:
        if kw in msg:
            return "template"

    return "content"


@router.post("/{resume_id}/chat", response_model=ApiResponse[ChatResponse])
async def chat_resume(
    user: CurrentUser, db: DB, resume_id: UUID, payload: ChatRequest
) -> dict:
    """Process a chat message and return an AI-edited version of the resume.

    Automatically detects whether the request is about content (skills, bullets,
    sections) or template styling (colors, fonts, layout) and routes to the
    appropriate agent. Template edits are persisted to the per-resume template
    copy; content edits are returned for the frontend to persist.
    """
    from src.schemas.resume import ResumeContent as RC

    resume = await resume_service.get_by_id(db, user, resume_id)
    intent = await _classify_chat_intent(payload.message)

    if intent == "reorder":
        # Section reordering is done via drag-and-drop in the Edit Form
        response = ChatResponse(
            reply=(
                "To reorder sections, switch to the Edit Form tab — you can "
                "drag and drop any section up or down using the grip handle on "
                "the left side of each section. The PDF preview will update "
                "automatically."
            ),
            updated_content=payload.current_content,
            changed=[],
            template_changed=False,
        )
    elif intent == "template":
        # Route to template editor — modifies .typ / .json files in-place
        result = await template_file_service.ai_edit_template(
            db, user, resume_id, payload.message
        )
        response = ChatResponse(
            reply=result["reply"],
            updated_content=payload.current_content,  # content unchanged
            changed=["template"],
            template_changed=True,
        )
    else:
        # Route to content editor — modifies resume JSON
        from src.agents import resume_editor_agent

        result = await resume_editor_agent.chat(
            message=payload.message,
            current_content=payload.current_content.model_dump(),
        )
        updated = RC.model_validate(result["updated_content"])
        response = ChatResponse(
            reply=result["reply"],
            updated_content=updated,
            changed=result["changed"],
            template_changed=False,
        )

    return {"success": True, "data": response}


# ── Template file endpoints ──────────────────────────────────────────────────


@router.get(
    "/{resume_id}/template-files",
    response_model=ApiResponse[TemplateFileListResponse],
)
async def list_template_files(
    user: CurrentUser, db: DB, resume_id: UUID
) -> dict:
    """List all files in the per-resume template folder."""
    entries = await template_file_service.list_template_files(db, user, resume_id)
    return {"success": True, "data": TemplateFileListResponse(files=entries)}


@router.get(
    "/{resume_id}/template-files/{file_path:path}",
    response_model=ApiResponse[TemplateFileContent],
)
async def read_template_file(
    user: CurrentUser, db: DB, resume_id: UUID, file_path: str
) -> dict:
    """Read a single template file's content."""
    content = await template_file_service.read_template_file(
        db, user, resume_id, file_path
    )
    return {
        "success": True,
        "data": TemplateFileContent(path=file_path, content=content),
    }


@router.put(
    "/{resume_id}/template-files/{file_path:path}",
    response_model=ApiResponse[TemplateFileContent],
)
async def write_template_file(
    user: CurrentUser,
    db: DB,
    resume_id: UUID,
    file_path: str,
    payload: TemplateFileWriteRequest,
) -> dict:
    """Write (overwrite) a template file. Only .typ and .json files allowed."""
    await template_file_service.write_template_file(
        db, user, resume_id, file_path, payload.content
    )
    return {
        "success": True,
        "data": TemplateFileContent(path=file_path, content=payload.content),
    }


@router.post("/{resume_id}/template-reset")
async def reset_template(
    user: CurrentUser, db: DB, resume_id: UUID
) -> dict:
    """Reset the per-resume template to the latest shared version.

    Discards all user customizations and re-copies from the shared template.
    """
    await template_file_service.reset_template(db, user, resume_id)
    return {"success": True, "data": None}


@router.post(
    "/{resume_id}/template-edit",
    response_model=ApiResponse[TemplateEditResponse],
)
async def ai_edit_template(
    user: CurrentUser, db: DB, resume_id: UUID, payload: TemplateEditRequest
) -> dict:
    """AI-powered template file editing.

    The agent reads all editable template files, applies the requested changes,
    and persists the updated files. Returns the reply and list of changed files.
    """
    result = await template_file_service.ai_edit_template(
        db, user, resume_id, payload.message, payload.target_file
    )
    return {
        "success": True,
        "data": TemplateEditResponse(
            reply=result["reply"], changes=result["changes"]
        ),
    }
