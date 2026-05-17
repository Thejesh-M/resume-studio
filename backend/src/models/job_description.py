import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from src.core.column_types import JSONB, UUID
from src.core.database import Base


class JobDescription(Base):
    __tablename__ = "job_descriptions"
    __table_args__ = (
        UniqueConstraint("user_id", "raw_text_hash", name="uq_user_jd_hash"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    company: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    raw_text_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)  # SHA-256
    agent_analysis: Mapped[dict | None] = mapped_column(JSONB(), nullable=True)  # JDAnalysis JSON
    source_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
