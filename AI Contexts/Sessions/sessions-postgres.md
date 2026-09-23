# HTTP sessions → Postgres

Living plan for moving Express/Passport sessions off the Mongo shared database onto the single Postgres database.

## Status

- **Analysis** — done (2026-09-23).
- **Decisions** — locked (2026-09-23). See Decisions.
- **Implementation** — in place, not shipped. Schema `022`, store factory, both call sites, shared-db copy. Default remains `mongo`.

## Task

Stop storing HTTP sessions in Mongo `uwazi_shared_db` (test: `uwazi_shared_db_testing`). Store them in the single combined Postgres database (`POSTGRES_DB`), table `http_sessions`.

The session store is one process-wide object. Tenant isolation stays the `id///tenant` string inside `passport.user`. No row-level security, no `tenant_id` column.

Out of scope:

- Changing login (`LoginUseCase` + `req.logIn`). There is no Passport strategy to replace.
- Changing the `connect.sid` cookie name. Sockets and several controllers use that name as a room / correlation key.
- Changing the serialized payload. It stays `` `${user._id}///${tenant}` ``.
- Users, settings, or any other module's Postgres cutover.
- A sessions domain model. A session row is Express infrastructure, same class of thing as the job queue table, not a core aggregate.
- A way to delete every session for one tenant. No such operation exists, so no column for it.

## How it works today

Two copies of the same store, both built once at startup against `config.SHARED_DB`:

- HTTP: `app/api/auth/routes.js` → `authenticatedUserMiddlewares()` → `MongoStore.create(...)`.
- Sockets: `app/api/socketio/setupSockets.ts` → `getSessionStore()`. Falls back to `MemoryStore` if Mongo is not connected (tests that never open a DB).

`express-session` options:

- `resave: false`, `saveUninitialized: false`.
- Cookie secret: `USER_SESSION_SECRET` in production, hardcoded `harvey&lola` otherwise. No `cookie.maxAge`, no `cookie.domain`, default cookie name `connect.sid`.
- `connect-mongo` `touchAfter: 24 * 3600`. `ttl` is not passed, so the library default applies: **14 days** (`1209600` seconds). Expired rows are removed by a Mongo TTL index on `expires`.

`connect-mongo` defaults `stringify: true`, and our call sites do not turn it off. A document in `sessions` looks like:

- `_id` — session id
- `session` — JSON **string** of the Express session (`cookie`, `passport.user`)
- `expires` — `Date`
- `lastModified` — `Date`, present because `touchAfter > 0`. Kept **outside** the session JSON. `get` attaches it in memory; `touch` skips the write when it is less than 24h old.

Request order in `app/server.js`:

1. `multitenantMiddleware` sets the tenant on `appContext` from the `tenant` header (or the default tenant).
2. After Mongo connects: session middleware, then `passport.initialize()` / `passport.session()`.
3. `dependenciesContextMiddleware` snapshots `req.user` into `ExecutionContext`. Deserialization therefore runs **before** an ExecutionContext exists. `UsersDirectoryFactory` already special-cases that (fresh transaction manager when there is no store).

Login does not use a Passport strategy. `LoginController` runs `LoginUseCase`, then `req.logIn(user)`, which calls `serializeUser`. `passport-local` is in `package.json` and has no callers.

Logout is `req.session.destroy()`.

Sockets do not go through Passport. On connect, `attachRoleRoomsIfApplicable` loads the session by sid, splits `passport.user` on `///`, checks the tenant, then loads the user inside `tenants.run`. Redis is the Socket.IO adapter in cluster mode. It is not the session store.

`app/api/utils/testingRoutes.ts` builds the session middleware lazily, because `setUpApp` often runs before Mongo is connected.

## Why the shared database

The store is constructed once, with one Mongo client. A multi-tenant process has many Mongo databases and one shared database, so the store cannot follow the current tenant's database.

The tenant is already known when session middleware runs. That would be enough to branch per request. Sessions were put in the shared db because the store is process-wide infrastructure, same as the `tenants` collection and (originally) `jobs`.

`deserializeUser` loads the user from the tenant database (Mongo or Postgres users, via `postgresCore`). The session row is only the pointer.

## Why `id///tenant`

`passport_conf.js` stores `` `${user._id}///${tenants.current().name}` ``. Deserialization and the socket role-room path both return unauthenticated when the name after `///` is not the current tenant. `deserializeUser.spec.ts` pins the mismatch case.

The check exists because the store is shared. A copied session id would otherwise resolve `users._id` in the wrong database. The delimiter is triple slash because an ObjectId hex string cannot contain it. **This stays.** It is the cross-tenant guard, and it is independent of RLS.

## Library

Replace **`connect-mongo`** with **`connect-pg-simple`**. Not a Passport plugin. Not `connect-session-knex` (we already have an `app_user` `pg.Pool` at `PostgresDB.pool()`; Knex's pool is not a `pg.Pool`). Not a custom store.

Use the library's queries and column names as-is: `sid`, `sess`, `expire`. Our schema migration creates `http_sessions` (the library default name `session` collides with Mongo client sessions and Knex transactions). Pass `tableName: 'http_sessions'`. `createTableIfMissing: false`. Do not copy their `table.sql` (`COLLATE "default"`, `OIDS`).

Wire `PostgresDB.pool()` (the `app_user` pool), not `adminPool()` and not the Knex pool. `ALTER DEFAULT PRIVILEGES` in `002-create_migrator_user.sql` already grants `app_user` DML on tables the migrator creates.

Two settings are not the library defaults, because those defaults would shorten sessions and write on every request:

- `ttl: 14 * 24 * 60 * 60`. With no `cookie.maxAge`, `connect-pg-simple` would use **1 day**. `connect-mongo` here is 14 days. One-day sessions were already a source of complaints.
- A thin subclass for `touchAfter: 24 * 3600`. The library has `disableTouch` (never slide) or touch-on-every-request. It has no "at most once a day". The subclass is the whole departure from stock behavior: `get` attaches `lastModified` in memory the way `connect-mongo` does, `touch` no-ops inside the window, `set` strips `lastModified` so it is not written into `sess`. No extra column. Pruning stays the library default (`pruneSessionInterval` 900s, randomized).

`sess` is `jsonb`. The library sends JSON text either way; `jsonb` matches the rest of the schema.

## Flag

`SESSIONS_BACKEND=mongo|postgres`, default `mongo`, whole process. Same idea as `QUEUE_BACKEND`. Not a tenant feature flag. Not dual-read.

The process reads and writes only the backend the env names. Turning the flag back to `mongo` does not copy Postgres rows back. Those users sign in again.

## Copy

One copy, from the shared db, then the flag flips. No second read path.

Jobs are the similar runtime case, and they are **not** a copy we can reuse. There is no jobs `MigrationConfig`, and `migrateToPostgres.ts` never mentions `jobs`. What jobs already solved is the **shape**: Mongo `jobs` live in `config.SHARED_DB` with a `namespace` column (the tenant name), and `021-create-jobs-table.sql` keeps that column and skips RLS. New jobs are written to Mongo or Postgres by `postgresCore` / `QUEUE_BACKEND`. In-flight rows were not backfilled.

A jobs copy, if we added one, would be per tenant **from the shared db**: `find({ namespace: tenantName })`, and the Postgres row would still carry `namespace`. Sessions do not follow that. Do not add `namespace`, `tenant_id`, or any other column so the copier can filter. The tenant stays inside the session JSON (`passport.user` = `id///tenant`), which is where it is today. The Postgres table is only the `connect-pg-simple` shape of the current Mongo document: `sid`, `sess`, `expire`.

`MigrateCollectionToPostgres` / `scripts/scripts.v2/migrateToPostgres.ts` also cannot take sessions as another `FLAG_GROUPS` entry:

- `--tenant` is required, and the script opens `tenants.current().dbName`, not `config.SHARED_DB`.
- `insertBatch` always sets `tenant_id` from the tenant argument and inserts through `PostgresTable`, which sets `app.current_tenant` for RLS.
- The "table already has rows" skip is per tenant under that RLS context. On a table with no RLS and no `tenant_id`, the first inserted row would make every later tenant skip the whole table.

Evolve that script with a shared-db mode, rather than a second copier:

- Read `DB.mongodb_Db(config.SHARED_DB)`.
- Do not stamp `tenant_id`, and do not open a tenant-scoped `PostgresTable` transaction. Insert with the `app_user` connection the store will use.
- Run **once for the process**, not once per `--tenant`. The flag is process-wide and the table has nothing to slice on. A per-tenant loop would re-scan the same collection and then skip after the first row.
- Conflict target is `sid`, `ON CONFLICT DO NOTHING`.

There is no shape break that would stop the copy. Map each Mongo document:

| Mongo `sessions` | `http_sessions` |
| --- | --- |
| `_id` | `sid` |
| `JSON.parse(session)` (it is stored as a string) | `sess` |
| `expires` | `expire` |

Leave `lastModified` behind. It is not part of the session JSON. The first request after cutover may write `expire` once, because the in-memory `lastModified` is absent; after that, touch is once a day again.

Copy every document, including already expired ones. Prune deletes those. Re-running is `ON CONFLICT (sid) DO NOTHING`: fill sids that are missing, do not overwrite a row Postgres has already updated.

Order of operations:

1. Ship the schema. The table is unused while `SESSIONS_BACKEND` is still `mongo`.
2. Run the copy once, while the process is still on Mongo.
3. Flip `SESSIONS_BACKEND=postgres` and restart.

Sessions created after the copy and before the restart are only in Mongo. Those users sign in again. That window is the cost of copy-once. Do not dual-read to close it.

That mode is not a `FLAG_GROUPS` entry and it is not gated on `postgresCore`. A Postgres session may still point at a Mongo user, and the reverse: the row is only an id and a tenant name.

## Decisions

| Topic | Decision |
| --- | --- |
| Store | `connect-pg-simple` on `PostgresDB.pool()` |
| Table | `http_sessions` (`sid`, `sess` jsonb, `expire`). Index on `expire`. No `namespace`, no `tenant_id`, no other columns. |
| Flag | `SESSIONS_BACKEND=mongo\|postgres`, default `mongo` |
| RLS | No |
| Tenant guard | Existing `id///tenant` check, unchanged |
| Existing rows | Copy once from shared `sessions`. No dual-read. No copy back to Mongo. |
| TTL / touch | 14 days. Touch at most once per 24h, via a thin subclass. Library prune stays. |
| Domain module | No |

## Implementation

Shipped in this branch, default still `mongo`. TDD: each spec was red for the missing table, the missing store, the empty `http_sessions` table after login, and the missing copier, then green.

1. Schema migration via `yarn add-migration schema` (generator assigns the number; current highest is `021`). `http_sessions (sid varchar primary key, sess jsonb not null, expire timestamp(6) not null)` plus an index on `expire`. No RLS.
2. One store factory used by `routes.js` and `setupSockets.ts`. Branch on `SESSIONS_BACKEND`. Mongo branch keeps today's `MongoStore` options, including `touchAfter` and the `MemoryStore` fallback.
3. Postgres branch: `connect-pg-simple` as above, plus the `touchAfter` subclass. `serializeUser` / `deserializeUser` unchanged.
4. Shared-db mode on `migrateToPostgres.ts` / `MigrateCollectionToPostgres`: one run, source `config.SHARED_DB` `sessions`, no `tenant_id`, conflict on `sid`. Not a `FLAG_GROUPS` / `--tenant` entry.
5. Tests: login → cookie → `/api/user` → `/logout` on Postgres; a copied Mongo document round-trips (`sid` / parsed `sess` / `expire`), including `passport.user` still containing `///`; deserialize still rejects a foreign tenant; socket role rooms still refuse a mismatched tenant; touch inside 24h does not write; Mongo path still works when the env is unset.

V1 rule: `routes.js` and `passport_conf.js` stay as they are apart from the store wiring. No hexagon around this.

## TODOs

- [x] Read backend AGENTS, architecture, migrations, v1-legacy.
- [x] Trace session middleware, Passport serialize/deserialize, socket store, login/logout.
- [x] Compare with users / settings (`postgresCore` + RLS) and jobs (`QUEUE_BACKEND`, no RLS).
- [x] Pick `connect-pg-simple` and record the `ttl` / `touchAfter` gaps.
- [x] Lock decisions (flag, no RLS, copy once, 14-day touch, `http_sessions`, keep `///`).
- [x] Schema migration `022-create-http-sessions-table.sql`.
- [x] Store factory (`app/api/auth/httpSessionStore.ts`) and both call sites.
- [x] Shared-db copy: `copyHttpSessions` + `migrateToPostgres.ts --sessions`.
- [x] Specs: schema, store (mongo + postgres, touch window), login round-trip, copy. Lint and `yarn check-types` on the files we touched.
- [ ] Run `--sessions` against a real shared database before flipping `SESSIONS_BACKEND`. Not done here.

## Questions

None open.

## Progress

- **2026-09-23** — Analysis written.
- **2026-09-23** — Decisions locked. Copy is in scope: one pass from the shared `sessions` collection into `http_sessions`, because the document maps onto `sid` / `sess` / `expire` with no leftover column. The per-tenant migrator is the wrong tool (it reads a tenant db and stamps `tenant_id`). `touchAfter` is a subclass, not a library option; the table and the queries stay stock. No code yet.
- **2026-09-23** — Jobs do not have a backfill. Their tenant handling is a `namespace` column on the shared Mongo collection and on the Postgres table, and new writes follow `postgresCore` / `QUEUE_BACKEND`. Sessions do not gain that column. The copy script grows a shared-db mode: one process-wide run, and the row stays `sid` / `sess` / `expire`.
- **2026-09-23** — Implemented. `SESSIONS_BACKEND` defaults to `mongo`. Postgres uses `connect-pg-simple` on `PostgresDB.pool()` with a wrapper that skips touch inside 24h and keeps TTL at 14 days. Copy is `node scripts/runner.js scripts/scripts.v2/migrateToPostgres.ts --sessions` (shared db, `ON CONFLICT (sid) DO NOTHING`, no tenant column). Schema is `022`.
