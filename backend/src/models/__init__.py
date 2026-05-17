from src.core.database import Base
from src.models.cover_letter import CoverLetter
from src.models.job_description import JobDescription
from src.models.resume import UserResume
from src.models.tailored_version import TailoredVersion
from src.models.template import Template
from src.models.user import User


def register_models() -> None:
    """No-op — importing this module already registers all models with ``Base``."""
    return None


__all__ = [
    "Base",
    "CoverLetter",
    "JobDescription",
    "TailoredVersion",
    "Template",
    "User",
    "UserResume",
    "register_models",
]
