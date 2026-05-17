# Frontend — Resume Studio

Next.js (App Router) UI for Resume Studio.

> See the **[root README](../README.md)** for the project-wide quick start (`./run.sh`). This file covers frontend-only details.

## Stack

- **Next.js 16** (App Router, React 19)
- **TanStack Query** for server state
- **Tailwind v4** + **shadcn/ui** primitives
- **Zod** for input schemas
- **Playwright** for E2E tests

## Layout

```
src/
├── app/                      # Next.js App Router routes
│   ├── (app)/                # Authenticated-style layout group
│   │   ├── dashboard/        # Landing page
│   │   ├── onboarding/       # "Build a resume" flow
│   │   ├── resumes/          # List + detail + editor + tailor sub-routes
│   │   ├── editor/           # AI Editor entry point
│   │   ├── tailor/           # Streamlined tailor flow
│   │   ├── cover-letter/     # Cover-letter generator
│   │   ├── templates/        # Template gallery
│   │   └── docs/             # In-app docs page
│   └── layout.tsx            # Root providers (Theme, Query, Tooltip, Toast)
├── components/               # UI + feature components
├── hooks/                    # React Query hooks per resource
├── lib/                      # Constants, validators, utils
├── providers/                # Theme/Query/Tooltip/Toast providers
├── services/                 # API clients (one per backend resource)
└── types/                    # Shared TS types
```

## Configure

Nothing required for local dev — `./run.sh` exports `NEXT_PUBLIC_API_URL` for you.

If you run `npm run dev` directly and the backend isn't on `http://localhost:8000`, point at it:

```bash
export NEXT_PUBLIC_API_URL=http://localhost:8001
npm run dev
```

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Where the FastAPI backend lives |
| `NEXT_PUBLIC_USE_MOCKS` | `false` | Set `true` to use in-browser mock data instead of the backend |

## Run

```bash
# From repo root (preferred — also boots the backend):
./run.sh frontend

# Or directly:
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build & lint

```bash
npm run build       # production bundle
npm run lint        # eslint
npx tsc --noEmit    # type check
```

## E2E

```bash
npx playwright test
```

Tests live in [`e2e/`](./e2e). Backend must be running.

## Adding a feature

1. **Type** — add to `src/types/`.
2. **Service** — add a function in `src/services/<resource>-service.ts` calling `apiClient`.
3. **Hook** — wrap the service in TanStack Query in `src/hooks/use-<resource>.ts`.
4. **Component / page** — build the UI under `src/components/` and route it from `src/app/(app)/`.
5. **Sidebar entry** (optional) — add to `NAV_ITEMS` in `src/components/layout/sidebar.tsx` and `mobile-nav.tsx`.

## License

MIT — see the [root LICENSE](../LICENSE).
