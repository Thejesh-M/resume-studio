from datetime import datetime, UTC
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.column_types import UUID
from src.core.database import Base


class CoverLetter(Base):
    __tablename__ = "cover_letters"

    id: Mapped[UUID] = mapped_column(
        UUID(), primary_key=True, default=uuid4
    )
    user_id: Mapped[UUID] = mapped_column(
        UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    resume_id: Mapped[UUID] = mapped_column(
        UUID(), ForeignKey("user_resumes.id", ondelete="CASCADE"), nullable=False
    )
    jd_id: Mapped[UUID] = mapped_column(
        UUID(), ForeignKey("job_descriptions.id", ondelete="SET NULL"), nullable=True
    )
    # task_id == str(id) — used to reference Firestore task doc
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    credits_used: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="cover_letters")
    resume = relationship("UserResume")
    job_description = relationship("JobDescription")
