# Backend — Open Resume Studio

FastAPI service for resume parsing, AI agents, Typst PDF compilation, and persistence.

> See the **[root README](../README.md)** for the project-wide quick start (`./run.sh`). This file covers backend-only details.

## Stack

- **FastAPI** with async SQLAlchemy 2
- **SQLite** (default) — switch to **Postgres** by setting `DATABASE_URL`
- **Typst** CLI — invoked as a subprocess to compile resumes to PDF
- **Multi-provider LLM layer** — Gemini / OpenAI / Anthropic / Ollama via a thin abstraction

## Layout

```
src/
├── agents/        # LLM-backed agents (extractor, scorer, rewriter, compiler, orchestrator, …)
├── api/           # FastAPI routers
│   ├── v1/        # Public endpoints (resumes, tailoring, cover_letter, templates, users)
│   └── internal/  # Worker endpoints called by the in-process task dispatcher
├── core/          # config, database, storage, llm provider factory, security, exceptions
├── models/        # SQLAlchemy models
├── schemas/       # Pydantic request/response models
├── services/      # Business logic (called by routers)
└── main.py        # FastAPI app, lifespan, CORS, router mounts

templates/         # Typst template variants (bundled, scanned + seeded on startup)
scripts/           # Standalone scripts (template seeding, preview generation)
tests/             # pytest
```

## Configure

Every setting is a shell env var or a line in `backend/.env`. Shell wins over file.

```bash
# Shell — keys never touch disk
export LLM_PROVIDER=gemini
export GEMINI_API_KEY=sk-...
```

Or copy [.env.example](./.env.example) → `.env`.

The full list of supported settings lives in [`src/core/config.py`](./src/core/config.py).

## Run

```bash
# From repo root (preferred — also boots the frontend):
./run.sh backend

# Or directly:
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e .
uvicorn src.main:app --reload --port 8000
```

First run creates `../data/open_resume_studio.db`, seeds the templates table from `templates/`, and renders preview PNGs into `../frontend/public/previews/` (skipped if `typst` is missing).

## Test

```bash
pytest
```

## What lives where on disk

| Path | Purpose |
|---|---|
| `../data/open_resume_studio.db` | SQLite database |
| `../data/storage/` | Uploaded resumes, generated PDFs, per-resume template copies |
| `templates/<category>/<variant>/` | Bundled Typst templates |
| `../frontend/public/previews/` | Auto-generated template preview PNGs |

## Extending it

- **Add an LLM provider** — implement a class in `src/core/llm.py` and register it in `_PROVIDERS`.
- **Add a template** — drop a folder under `templates/<category>/<variant>/` containing `template.typ` and a sample `content.json`. It will be seeded on next startup.
- **Add an API endpoint** — new router under `src/api/v1/`, then mount in `src/main.py`.

## License

MIT — see the [root LICENSE](../LICENSE).
