"""Local filesystem storage for resumes, templates, and generated artifacts.

Everything is rooted at ``settings.storage_dir`` (default: ``<repo>/data/storage``).
The public function signatures match the original cloud-backed implementation so
existing services don't need to change.
"""

from __future__ import annotations

import logging
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path

from src.core.config import settings

logger = logging.getLogger(__name__)

_STORAGE_ROOT = Path(settings.storage_dir)


def _abs(bucket_path: str) -> Path:
    """Resolve a storage-relative path to an absolute filesystem path.

    Defends against path traversal: the resolved path must stay under the
    configured storage root.
    """
    candidate = (_STORAGE_ROOT / bucket_path).resolve()
    if _STORAGE_ROOT.resolve() not in candidate.parents and candidate != _STORAGE_ROOT.resolve():
        raise ValueError(f"Path escapes storage root: {bucket_path}")
    return candidate


async def upload_bytes(
    bucket_path: str,
    data: bytes,
    content_type: str = "application/octet-stream",  # noqa: ARG001 (kept for API parity)
) -> str:
    path = _abs(bucket_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    logger.debug("storage: wrote %d bytes to %s", len(data), path)
    return bucket_path


async def upload_file(
    bucket_path: str,
    file_path: str,
    content_type: str = "application/octet-stream",
) -> str:
    return await upload_bytes(bucket_path, Path(file_path).read_bytes(), content_type)


async def download_bytes(bucket_path: str) -> bytes:
    return _abs(bucket_path).read_bytes()


async def download_text(bucket_path: str) -> str:
    return (await download_bytes(bucket_path)).decode("utf-8")


async def upload_text(bucket_path: str, text: str) -> str:
    return await upload_bytes(bucket_path, text.encode("utf-8"), "text/plain; charset=utf-8")


async def generate_signed_url(bucket_path: str, expiry_seconds: int = 3600) -> str:  # noqa: ARG001
    """Return a path the API can serve directly via the /files endpoint.

    There are no signed URLs in a local app — we just expose the file through
    a static route. The frontend calls ``GET {api}/files/{bucket_path}``.
    """
    return f"/files/{bucket_path}"


async def delete_file(bucket_path: str) -> None:
    path = _abs(bucket_path)
    if path.exists():
        path.unlink()
        logger.debug("storage: deleted %s", path)


async def move_file(
    src_path: str,
    dst_path: str,
    content_type: str = "application/octet-stream",  # noqa: ARG001
) -> None:
    src = _abs(src_path)
    dst = _abs(dst_path)
    if not src.exists():
        logger.warning("move_file: source not found: %s", src)
        return
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(src), str(dst))


async def list_files(prefix: str) -> list[str]:
    if not prefix.endswith("/"):
        prefix = prefix + "/"
    base = _abs(prefix)
    if not base.exists():
        return []
    return sorted(str(p.relative_to(base)) for p in base.rglob("*") if p.is_file())


async def copy_template_to_resume(
    user_id: str,
    resume_id: str,
    template_category: str,
    template_variant: str,
) -> list[str]:
    """Copy a shared template variant into a resume's per-resume ``template/`` folder.

    Shared templates ship inside the repo at ``backend/templates/{category}/{variant}``.
    """
    _TEMPLATES_ROOT = Path(__file__).resolve().parent.parent.parent / "templates"
    src_dir = _TEMPLATES_ROOT / template_category / template_variant
    dst_prefix = f"users/{user_id}/resumes/{resume_id}/template"
    dst_dir = _abs(dst_prefix)

    written: list[str] = []
    if not src_dir.exists():
        logger.warning("Template dir not found: %s — template/ folder will be empty", src_dir)
        return written

    if dst_dir.exists():
        shutil.rmtree(dst_dir)

    for src_file in src_dir.rglob("*"):
        if not src_file.is_file():
            continue
        relative = src_file.relative_to(src_dir).as_posix()
        dst_path = dst_dir / relative
        dst_path.parent.mkdir(parents=True, exist_ok=True)
        dst_path.write_bytes(src_file.read_bytes())
        written.append(f"{dst_prefix}/{relative}")
    return written


def _ts() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")


# Path builders (unchanged API) ------------------------------------------------


def make_upload_path(user_id: str, filename: str) -> str:
    ext = Path(filename).suffix
    return f"users/{user_id}/uploads/{uuid.uuid4().hex}{ext}"


def make_resume_upload_path(user_id: str, resume_id: str, filename: str) -> str:
    ext = Path(filename).suffix
    return f"users/{user_id}/resumes/{resume_id}/uploads/{_ts()}_{uuid.uuid4().hex}{ext}"


def make_extraction_path(user_id: str, resume_id: str) -> str:
    return f"users/{user_id}/resumes/{resume_id}/extracted/{_ts()}.json"


def make_temp_upload_path(user_id: str, extraction_id: str, filename: str) -> str:
    ext = Path(filename).suffix
    return f"users/{user_id}/extractions/{extraction_id}/raw{ext}"


def make_temp_extraction_path(user_id: str, extraction_id: str) -> str:
    return f"users/{user_id}/extractions/{extraction_id}/extracted.json"


def make_theme_path(user_id: str, resume_id: str) -> str:
    return f"users/{user_id}/resumes/{resume_id}/theme.json"


def make_resume_path(user_id: str, resume_id: str, filename: str) -> str:
    return f"users/{user_id}/resumes/{resume_id}/{filename}"


def make_resume_template_path(user_id: str, resume_id: str, relative: str) -> str:
    return f"users/{user_id}/resumes/{resume_id}/template/{relative}"


def make_tailored_path(user_id: str, version_id: str, filename: str) -> str:
    return f"users/{user_id}/tailored/{version_id}/{filename}"
