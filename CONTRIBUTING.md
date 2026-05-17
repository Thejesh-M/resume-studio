# Contributing to Open Resume Studio

Thanks for considering a contribution. This is a local-first tool — your changes should keep that property: no required cloud services, no required accounts, runnable offline if the user picks Ollama.

## Project layout

```
backend/    FastAPI + SQLAlchemy. AI agents live under src/agents.
frontend/   Next.js (App Router). UI components under src/components.
```

The backend doesn't know about the frontend; the frontend talks to the backend over HTTP at `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`).

## Dev setup

See [README.md](./README.md). Once it's running, the loop is:

- Edit code in `backend/src/` → uvicorn reloads automatically.
- Edit code in `frontend/src/` → Next.js HMR picks it up.

## Tests

```bash
cd backend && pytest
cd frontend && npm run lint
```

E2E tests use Playwright and live in `frontend/e2e/`.

## Style

- Python: ruff + black-compatible formatting; type-annotate everything you export.
- TypeScript: keep it strict, prefer `unknown` over `any`, model props with explicit interfaces.
- Files: many small files beats one big file. Aim for <400 LOC per module.

## What we want

- **Bug fixes.** Always welcome.
- **New LLM providers.** Add a class to `backend/src/core/llm.py` and register it in `_PROVIDERS`.
- **New resume templates.** Drop a Typst template under `backend/templates/<category>/<variant>/`.
- **Better defaults.** If a new contributor stumbles on something, that's a doc or default worth fixing.

## What we don't want

- Re-introducing cloud dependencies (Firebase, GCS, Cloud Tasks, Stripe, etc.). Optional integrations behind a flag are fine; required cloud services are not.
- Telemetry without explicit opt-in.
- Paywalls of any kind.

## Pull requests

Keep PRs focused — one logical change per PR. Include a one-line summary of why, not just what. If you added a provider or template, include a screenshot or a sample output.
