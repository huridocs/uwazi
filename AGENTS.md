# Uwazi

Flexible database application for capturing and organising document collections (HURIDOCS).

## Read first

- **Stack:** React SPA (SSR) + Express API + MongoDB (legacy) / PostgreSQL (V2).
- **Back-end Mid-migration:** V1 (legacy, `app/api/entities`) → V2 (hexagonal/DDD, `app/api/core`); Mongo → Postgres.
- **Front-end Mid-migration:** V1 (Redux, `api`) → V2 (Jotai, `apiClient`).
- Shared front-end/back-end code lives in `app/shared/` (import alias `#shared/*`).

## Commands

- **Test:** `yarn test <path-or-pattern>` — defaults to 4 workers; override with `-w=N` or `-w=%`
- **Type check:** `yarn check-types`
- **Lint:** `yarn lint --type-aware <paths>` — `--type-aware` activates the type-aware rules (e.g. `no-floating-promises`)
- **Format:** `yarn prettier --write` (use `yarn prettier` to check only)

## Rules and instructions

- Do not modify `AGENTS.md` or any `/docs` files unless explicitly asked.
- When working on back-end (`app/api`) or migrations read the `docs/backend.md`.
- When working on front-end (`app/react`) read the `docs/frontend.md`.
- You must execute test, type check, lint and format on affected scopes before finishing a task.
- When finishing a task, do not stage or commit.
- When writing tests use TDD, make sure you see a red for the expected reasons, before implementing.

## Additional resources

- Migration dashboard: `docs/migration-status.html` (refresh via `yarn migration-status`)


