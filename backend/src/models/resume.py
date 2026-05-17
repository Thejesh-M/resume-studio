import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.column_types import JSONB, UUID
from src.core.database import Base


class UserResume(Base):
    __tablename__ = "user_resumes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    # Nullable because raw-PDF uploads have no template or structured content.
    template_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(), ForeignKey("templates.id"), nullable=True
    )
    content: Mapped[dict | None] = mapped_column(JSONB(), nullable=True)  # ResumeContent JSON
    source_url: Mapped[str | None] = mapped_column(String(512), nullable=True)   # storage path to source.typ
    base_pdf_url: Mapped[str | None] = mapped_column(String(512), nullable=True)  # storage path to base.pdf
    original_upload_path: Mapped[str | None] = mapped_column(String(512), nullable=True)  # storage path: latest raw upload
    extraction_path: Mapped[str | None] = mapped_column(String(512), nullable=True)       # storage path: latest LLM snapshot
    theme_overrides: Mapped[dict | None] = mapped_column(JSONB(), nullable=True)           # mirror of theme.json delta
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # When true, this row is a raw PDF upload: use base_pdf_url as-is, skip
    # tailoring, and hide edit/score actions in the UI.
    is_raw_upload: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, server_default="false"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="resumes")  # noqa: F821
    template: Mapped["Template"] = relationship(lazy="selectin")  # noqa: F821
    tailored_versions: Mapped[list["TailoredVersion"]] = relationship(  # noqa: F821
        back_populates="user_resume", lazy="selectin"
    )
