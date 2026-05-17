import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.column_types import JSONB, UUID
from src.core.database import Base


class User(Base):
    """The synthetic local user.

    The local app is single-user; this table exists so existing service code
    (which expects a ``User`` foreign key) keeps working without churn.
    """

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    local_id: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False, index=True
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # { greenhouse_question_name: user_answer } — prefilled on future apply forms.
    saved_question_answers: Mapped[dict] = mapped_column(
        JSONB(), default=dict, nullable=False, server_default="{}"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    resumes: Mapped[list["UserResume"]] = relationship(  # noqa: F821
        back_populates="user", lazy="selectin"
    )
    cover_letters: Mapped[list["CoverLetter"]] = relationship(  # noqa: F821
        back_populates="user", lazy="select"
    )
