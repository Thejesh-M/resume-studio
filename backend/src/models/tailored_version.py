import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.column_types import JSONB, UUID
from src.core.database import Base


class TailoredVersion(Base):
    __tablename__ = "tailored_versions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    user_resume_id: Mapped[uuid.UUID] = mapped_column(
        UUID(),
        ForeignKey("user_resumes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    jd_id: Mapped[uuid.UUID] = mapped_column(
        UUID(),
        ForeignKey("job_descriptions.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="pending"
    )  # pending, processing, completed, failed
    tailored_content: Mapped[dict | None] = mapped_column(JSONB(), nullable=True)
    source_url: Mapped[str | None] = mapped_column(String(512), nullable=True)  # path to .typ
    pdf_url: Mapped[str | None] = mapped_column(String(512), nullable=True)  # path to .pdf
    score_before: Mapped[float | None] = mapped_column(Float, nullable=True)
    score_after: Mapped[float | None] = mapped_column(Float, nullable=True)
    diff: Mapped[list | None] = mapped_column(JSONB(), nullable=True)  # DiffChange[] JSON
    credits_used: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user_resume: Mapped["UserResume"] = relationship(back_populates="tailored_versions")  # noqa: F821
    job_description: Mapped["JobDescription"] = relationship(lazy="selectin")  # noqa: F821
