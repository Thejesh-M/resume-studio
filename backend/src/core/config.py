from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = PROJECT_ROOT / "data"
STORAGE_DIR = DATA_DIR / "storage"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database — defaults to a local SQLite file. Override with DATABASE_URL for Postgres.
    # Example: postgresql+asyncpg://user:pass@localhost:5432/open_resume_studio
    database_url: str = f"sqlite+aiosqlite:///{DATA_DIR / 'open_resume_studio.db'}"

    # Local storage root for uploaded resumes, generated PDFs, etc.
    storage_dir: str = str(STORAGE_DIR)

    # LLM provider: "gemini" | "openai" | "anthropic" | "ollama" | "none"
    # "none" disables AI features entirely (the app still runs).
    llm_provider: str = "gemini"

    # Provider API keys (only the one matching llm_provider is required)
    gemini_api_key: str = ""
    openai_api_key: str = ""
    anthropic_api_key: str = ""

    # Provider models — sensible defaults per provider
    gemini_model: str = "gemini-2.5-flash"
    openai_model: str = "gpt-4o-mini"
    anthropic_model: str = "claude-sonnet-4-6"
    ollama_model: str = "llama3.1"
    ollama_host: str = "http://localhost:11434"

    # URLs
    frontend_url: str = "http://localhost:3000"
    api_url: str = "http://localhost:8000"

    # CORS — comma-separated; defaults to frontend_url if not set
    allowed_origins: str = ""

    # Default user identity for the local single-user app.
    # No auth — all data is owned by this synthetic user.
    local_user_id: str = "local-user"
    local_user_email: str = "you@localhost"

    @property
    def cors_origins(self) -> list[str]:
        if self.allowed_origins:
            return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]
        return [self.frontend_url]


settings = Settings()

# Ensure data directories exist on first import — local-first, zero setup.
DATA_DIR.mkdir(parents=True, exist_ok=True)
Path(settings.storage_dir).mkdir(parents=True, exist_ok=True)
