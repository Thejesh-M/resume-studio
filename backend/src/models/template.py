import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from src.core.column_types import UUID
from src.core.database import Base


class Template(Base):
    __tablename__ = "templates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    variant: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    preview_url: Mapped[str] = mapped_column(String(512), nullable=False)
    engine: Mapped[str] = mapped_column(String(20), nullable=False, default="typst")  # latex, typst
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_ats_tested: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
