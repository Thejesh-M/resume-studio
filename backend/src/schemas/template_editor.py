"""Schemas for the template file editor API."""

from pydantic import BaseModel


class TemplateFileEntry(BaseModel):
    """A single file in the per-resume template folder."""

    path: str  # relative path, e.g. "template.typ"
    size: int  # bytes


class TemplateFileListResponse(BaseModel):
    files: list[TemplateFileEntry]


class TemplateFileContent(BaseModel):
    """The content of a single template file."""

    path: str
    content: str


class TemplateFileWriteRequest(BaseModel):
    """Write (overwrite) a file in the per-resume template folder."""

    content: str


class TemplateFileChange(BaseModel):
    file_path: str
    content: str


class TemplateEditRequest(BaseModel):
    """AI-powered template edit request."""

    message: str
    target_file: str | None = None  # hint: which file the user is viewing


class TemplateEditResponse(BaseModel):
    """AI-powered template edit result."""

    reply: str
    changes: list[TemplateFileChange]
