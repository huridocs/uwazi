# Uwazi

Flexible database application for capturing and organizing document collections (HURIDOCS).
React SPA (server-side rendered) + Express API running in a single process; MongoDB (legacy)
and PostgreSQL (V2). Two migrations are in flight — back-end V1→V2 and Mongo→Postgres,
front-end Redux→Jotai. New code follows V2 patterns; the area docs say what that means.

## Rules

These always apply. Do not skip one because a task looks small.

1. **Read the area doc before touching that area's code — and only that area's doc.**
   - Back-end — `app/api/**`, migrations (`app/api/migrations/**`), queue workers
     (`app/worker.ts`, `app/queueWorker.ts`, `app/setupQueueWorker.ts`), `scripts/**`,
     `database/**` → read `docs/backend/AGENTS.md` first.
   - Front-end — `app/react/**` → read `docs/frontend.md` first.
   - Do not load the other area's doc. A task that genuinely spans both loads both.
2. **TDD.** Write the test first and watch it fail for the expected reason before implementing.
3. **Verify before finishing.** Run test, type check, lint and format on the affected scope.
   Report what actually happened — never claim a green you did not see.
4. **Do not stage or commit** unless asked.
5. **Do not edit `AGENTS.md`, `CLAUDE.md` or anything under `docs/`** unless asked.

## Commands

- **Test:** `yarn test <path-or-pattern>` — 4 workers by default; override with `-w=N` or `-w=%`
- **Type check:** `yarn check-types`
- **Lint:** `yarn lint --type-aware <paths>` — `--type-aware` enables type-aware rules (e.g. `no-floating-promises`)
- **Format:** `yarn prettier --write` (omit `--write` to check only)

## Layout

- `app/api/` — Express API. `app/react/` — React SPA.
- `app/shared/` — code used by both, import alias `#shared/*`. Changes here affect both teams.
- `e2e/`, `cypress/`, `playwright/` — end-to-end tests.
