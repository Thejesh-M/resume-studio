import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from src.core.config import settings
from src.core.database import init_db
from src.core.exceptions import AppError, app_error_handler, unhandled_error_handler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    import asyncio

    # Create SQLite tables on first run (no-op if they already exist).
    if settings.database_url.startswith("sqlite"):
        await init_db()
        logger.info("Initialised local SQLite database at %s", settings.database_url)

    # Render template previews in the background — first run takes ~30s, later
    # runs are instant. Skipped silently if the Typst CLI is missing.
    async def _gen_previews_bg() -> None:
        try:
            from scripts.gen_previews import generate as gen_previews

            result = await gen_previews()
            logger.info(
                "Template previews: %d new, %d cached, %d failed",
                result["ok"], result["skipped"], result["failed"],
            )
        except Exception:  # noqa: BLE001
            logger.exception("Preview generation failed")

    asyncio.create_task(_gen_previews_bg())

    yield


app = FastAPI(
    title="Open Resume Studio",
    version="0.1.0",
    description="Local-first, open-source AI resume workspace.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS — local app, so any localhost/127.0.0.1 origin is OK regardless of port.
# Set ALLOWED_ORIGINS in .env if you want to override.
_cors_kwargs: dict = {
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}
if settings.allowed_origins:
    _cors_kwargs["allow_origins"] = settings.cors_origins
else:
    _cors_kwargs["allow_origin_regex"] = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"

app.add_middleware(CORSMiddleware, **_cors_kwargs)

app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(Exception, unhandled_error_handler)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "version": "0.1.0"}


# Serve files saved by the local storage backend at /files/...
_storage_root = Path(settings.storage_dir)
_storage_root.mkdir(parents=True, exist_ok=True)


@app.get("/files/{full_path:path}")
async def serve_file(full_path: str) -> FileResponse:
    candidate = (_storage_root / full_path).resolve()
    if _storage_root.resolve() not in candidate.parents:
        raise AppError("Invalid path", status_code=400, code="bad_path")
    if not candidate.exists() or not candidate.is_file():
        raise AppError("File not found", status_code=404, code="not_found")
    return FileResponse(candidate)


# Static-style mount as well (handy for direct linking from the frontend)
app.mount("/static", StaticFiles(directory=str(_storage_root)), name="static")


# Routers
from src.api.internal.tasks import router as internal_tasks_router  # noqa: E402
from src.api.v1.cover_letter import router as cover_letter_router  # noqa: E402
from src.api.v1.error_reports import router as error_reports_router  # noqa: E402
from src.api.v1.resumes import router as resumes_router  # noqa: E402
from src.api.v1.tailoring import router as tailoring_router  # noqa: E402
from src.api.v1.templates import router as templates_router  # noqa: E402
from src.api.v1.users import router as users_router  # noqa: E402

app.include_router(users_router, prefix="/api/v1")
app.include_router(resumes_router, prefix="/api/v1")
app.include_router(templates_router, prefix="/api/v1")
app.include_router(tailoring_router, prefix="/api/v1")
app.include_router(cover_letter_router, prefix="/api/v1")
app.include_router(error_reports_router, prefix="/api/v1")
app.include_router(internal_tasks_router)
