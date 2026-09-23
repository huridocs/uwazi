# HTTP sessions → Postgres

Living plan for moving Express/Passport sessions off the Mongo shared database. Analysis only so far. No production code until the open questions below are answered.

## Status

- **Analysis** — done (2026-09-23). Mechanism, shared-db reason, `///` tenant check, library options, and how this differs from users/settings/jobs.
- **Decisions** — open. Proposals are marked as proposals. Do not treat them as agreed.
- **Implementation** — not started.

## Task

Stop storing HTTP sessions in Mongo `uwazi_shared_db` (test: `uwazi_shared_db_testing`). Store them in the single combined Postgres database (`POSTGRES_DB`), the same database as users, settings, entities, and jobs.

This is not a per-tenant collection move. The session store is one process-wide object. Tenant isolation today is a string stuffed into `passport.user`, not a separate database and not row-level security.

Out of scope unless a decision below pulls it in:

- Changing login (`LoginUseCase` + `req.logIn`). There is no Passport strategy to replace.
- Changing the `connect.sid` cookie name. Sockets and several controllers use that name as a room / correlation key.
- Users, settings, or any other module's Postgres cutover.
- A sessions domain model. A session row is Express infrastructure, same class of thing as the job queue table, not a core aggregate.

## How it works today

Two copies of the same store, both built once at startup against `config.SHARED_DB`:

- HTTP: `app/api/auth/routes.js` → `authenticatedUserMiddlewares()` → `MongoStore.create(...)`.
- Sockets: `app/api/socketio/setupSockets.ts` → `getSessionStore()`. Falls back to `MemoryStore` if Mongo is not connected (tests that never open a DB).

`express-session` options (both call sites that set them; sockets only build the store):

- `resave: false`, `saveUninitialized: false`.
- Cookie secret: `USER_SESSION_SECRET` in production, hardcoded `harvey&lola` otherwise. No `cookie.maxAge`, no `cookie.domain`, default cookie name `connect.sid`.
- `connect-mongo` `touchAfter: 24 * 3600`. `ttl` is not set, so the library default applies (14 days). Expired rows are removed by a Mongo TTL index.

Request order in `app/server.js`:

1. `multitenantMiddleware` sets the tenant on `appContext` from the `tenant` header (or the default tenant).
2. After Mongo connects: session middleware, then `passport.initialize()` / `passport.session()`.
3. `dependenciesContextMiddleware` snapshots `req.user` into `ExecutionContext`. Deserialization therefore runs **before** an ExecutionContext exists. `UsersDirectoryFactory` already special-cases that (fresh transaction manager when there is no store).

Login does not use a Passport strategy. `LoginController` runs `LoginUseCase`, then `req.logIn(user)`, which calls `serializeUser`. `passport-local` is in `package.json` and has no callers.

Logout is `req.session.destroy()`.

Sockets do not go through Passport. On connect, `attachRoleRoomsIfApplicable` loads the session by sid, splits `passport.user` on `///`, checks the tenant, then loads the user inside `tenants.run`. Redis is the Socket.IO adapter in cluster mode. It is not the session store. Every node must see the same session rows, which is why the store is a database.

`app/api/utils/testingRoutes.ts` builds the session middleware lazily, because `setUpApp` often runs before Mongo is connected.

## Why the shared database

The store is constructed once, with one Mongo client, before any request. A multi-tenant process has many Mongo databases and one shared database. The store cannot follow "the current tenant's db" without becoming a different component.

The tenant **is** known by the time a request hits session middleware (`multitenantMiddleware` runs first). That is enough to *choose* a backend per request. It is not how the store is built today, and it is not why sessions were put in the shared db. They were put there because the store is process-wide infrastructure, same as the `tenants` collection and (originally) `jobs`.

`deserializeUser` then loads the user from the **tenant** database (now Mongo or Postgres users, via `postgresCore`). The session row never contained the user document. It only contains the pointer.

## Why `id///tenant`

`passport_conf.js`:

```js
done(null, `${user._id}///${tenants.current().name}`);
```

On the way back, deserialization splits on `///` and returns `false` if the serialized tenant is not `tenants.current().name`. The socket role-room path does the same check. `deserializeUser.spec.ts` pins the mismatch case.

That check exists because the store is shared. A session id copied onto another tenant's host would otherwise resolve `users._id` in the wrong database. User ids are not a global key. The delimiter is triple slash because an ObjectId hex string cannot contain it. Passport would also accept a JSON object (`{ id, tenant }`); the string is a choice, not a library limit. Existing Mongo rows store the string, so changing the shape is a compatibility decision (see questions).

This is the only cross-tenant guard. Nothing in the Mongo session document filters by tenant.

## Postgres equivalent of the library

The Mongo dependency to replace is **`connect-mongo`**, not a Passport plugin.

| Option | Fits | Why / why not |
| --- | --- | --- |
| **`connect-pg-simple`** | Proposed | Direct stand-in: `express-session` `Store`, `pg.Pool`, columns `sid` / `sess` / `expire`. We already have an `app_user` pool at `PostgresDB.pool()`, separate from the Knex pool that sets `app.current_tenant`. `createTableIfMissing` defaults to **false**, which matches "schema only via `yarn add-migration`". |
| `connect-session-knex` | No | Useful when the app has Knex and no `pg.Pool`. We have both, and Knex's pool is tarn, not `pg.Pool`, so it cannot be handed to `connect-pg-simple` either. Extra dependency, creates its own table by default. |
| Custom `express-session` Store | Only if we require RLS | Neither library writes `tenant_id` or runs `set_config('app.current_tenant', ...)`. RLS on `app_user` would hide every row (or error: `current_tenant()` uses `current_setting` without a missing-ok flag). A custom store is the cost of RLS. |

`connect-pg-simple` does not behave like `connect-mongo` out of the box:

- **TTL.** With no `cookie.maxAge`, `connect-pg-simple` defaults to **1 day**. `connect-mongo` defaults to **14 days**. We must pass `ttl` explicitly or sessions get shorter.
- **`touchAfter`.** Not supported. `disableTouch: true` stops all expiry sliding. Default touch updates `expire` on every request. Preserving "slide at most once per 24h" means a thin wrapper. Cluster mode makes the extra writes real, not theoretical.
- **Prune.** `pruneSessionInterval` defaults to 900s (randomized 50–150% so nodes don't prune in lockstep). Mongo uses a TTL index. Either is fine; don't also invent a second reaper.
- **Table DDL.** Their `table.sql` uses `COLLATE "default"` and `WITH (OIDS=FALSE)`, which we should not copy. Our migration owns the DDL. Column names must stay `sid`, `sess`, `expire` if we use the library. `json` vs `jsonb` both work with node-pg; `jsonb` is the better match for the rest of the schema.

Proposed table name: `http_sessions`, passed as `tableName`. The library default `session` collides with how this codebase says "session" (Mongo client sessions, Knex transactions).

Proposed wiring: `PostgresDB.pool()` (the `app_user` pool). Do not use `adminPool()` and do not share the Knex pool. `ALTER DEFAULT PRIVILEGES` in `002-create_migrator_user.sql` already grants `app_user` DML on tables the migrator creates.

## How other modules did it, and what applies here

| Module | Cutover | RLS | Applies to sessions? |
| --- | --- | --- | --- |
| Users, settings, entities, translations, relationship types | Per-tenant `postgresCore` | Yes, `tenant_id` + `current_tenant()` | No. Those rows live in the tenant's data and are read inside `ExecutionContext`, which sets the GUC inside a transaction. The session store runs before that context exists, and it is one store for every tenant. |
| Captchas, password recoveries | Were their own flags; tables still have RLS | Yes | No. Those collections were per-tenant Mongo, not shared-db. |
| **Jobs (`021-create-jobs-table.sql`)** | **Closest.** Dispatch follows `postgresCore`. The worker polls whichever backend `QUEUE_BACKEND` (`mongo` \| `postgres`, default `mongo`) names. One process, one backend. | **No.** Comment in the migration: workers see every tenant, so there is no current tenant to filter by. The adapter scopes by a `namespace` column. | The shape matches (shared Mongo collection → one Postgres table, tenant is a column/payload, not a database). The flag does **not** fully match: a job is written once and picked by a worker that can be a different process. A session cookie is written and read by the same request pipeline, so a per-tenant flag means a session created on Mongo becomes invisible the moment that tenant flips, and two tenants on one process need two stores. |

`UsersDirectoryFactory` already documents session deserialization as a caller with no ExecutionContext. Moving the store does not change that, and does not require `postgresCore` to be on. A Postgres session may still deserialize a Mongo user, and the reverse, because the session row is only an id plus a tenant name.

## Flag

A tenant feature flag is a poor fit for a singleton store. The workable shapes:

1. **Process env, one store.** Same idea as `QUEUE_BACKEND`. Proposed name `SESSIONS_BACKEND=mongo|postgres`, default `mongo`. Flip the process, every tenant uses that store. This is the proposal.
2. **Per-request branch on `postgresCore`.** Possible, because the tenant is already on `appContext`. Each flag flip logs that tenant out (the other store doesn't have the row). Two stores stay alive for the whole mixed period. This is the users/settings pattern forced onto a shared resource. Not proposed.
3. **Dual-read** (write Postgres, fall back to Mongo, copy on read). Soft cutover, no mass logout. More code, and it has to live in both `routes.js` and `setupSockets.ts`. Not proposed unless we refuse to drop live sessions.

The env flag and RLS are separate decisions. Jobs are the proof: no RLS, and still an env switch. Turning RLS on does not require a per-tenant flag. Skipping the per-tenant flag does not by itself forbid RLS. RLS is blocked by the library, not by the flag.

## RLS

Proposal: **no RLS on `http_sessions`**, same call as `jobs`.

What actually stops tenant A from using tenant B's session is the `///` check in `deserializeUser` and in `attachRoleRoomsIfApplicable`, plus an unguessable sid. That stays.

What RLS would add: `app_user` could not `SELECT` another tenant's session JSON. The JSON holds a user id and a tenant name, not a password. The sid in that row is enough to hijack the session if it leaks. Today the shared Mongo db has the same property for anyone with access to `uwazi_shared_db`.

Cost of adding RLS anyway: a custom store (or a wrapper that sets `app.current_tenant` on the connection for every `get`/`set`/`touch`/`destroy`) and a real `tenant_id` column the library will not populate. `set_config(..., true)` is transaction-local; doing it on a pooled connection without a transaction leaks the GUC to the next checkout. That pool is also a reason not to improvise.

A generated column (`split_part` on `sess->passport->user`) could support "delete this tenant's sessions" without RLS and without the library knowing. Nothing else in the app deletes sessions by tenant today. Left as a question, not part of the proposal.

## Proposed implementation (after the questions)

Not started. When it starts, TDD per `.cursor/rules/tdd.mdc`, and Jest unsandboxed per `.cursor/rules/local-test-runner.mdc`.

1. Schema migration via `yarn add-migration schema` (next number is whatever the generator assigns; current highest is `021`). Table `http_sessions (sid, sess jsonb, expire)` plus an index on `expire`. No RLS. No `createTableIfMissing`.
2. One store factory used by `routes.js` and `setupSockets.ts`, so the two copies cannot drift. Branch on `SESSIONS_BACKEND`. Mongo branch keeps today's `MongoStore` options, including `touchAfter` and the `MemoryStore` fallback.
3. Postgres branch: `connect-pg-simple` on `PostgresDB.pool()`, `ttl` 14 days, `createTableIfMissing: false`, `tableName: 'http_sessions'`, wrapper that honors `touchAfter` of 24h. `serializeUser` / `deserializeUser` unchanged.
4. Tests: login → cookie → `/api/user` → `/logout` against Postgres; deserialize still rejects a foreign tenant; socket role rooms still refuse a mismatched `///` tenant; Mongo path still works when the env is unset.
5. Do not copy Mongo `sessions` documents. Cutover logs people out. Say so in the release notes.

V1 rule: `routes.js` and `passport_conf.js` stay as they are apart from the store wiring. No hexagon around this.

## TODOs

- [x] Read backend AGENTS, architecture, migrations, v1-legacy.
- [x] Trace session middleware, Passport serialize/deserialize, socket store, login/logout.
- [x] Compare with users / settings (`postgresCore` + RLS) and jobs (`QUEUE_BACKEND`, no RLS).
- [x] Pick a Postgres store candidate and list the behavior gaps (`ttl`, `touchAfter`).
- [ ] Answer the open questions.
- [ ] Schema migration + store factory (TDD, red first).
- [ ] Switch both call sites.
- [ ] Specs listed in the proposal, unsandboxed.
- [ ] `yarn lint --type-aware --max-warnings 0`, prettier, `yarn check-types` on the files we touch.

## Questions

1. **Env switch.** Confirm `SESSIONS_BACKEND=mongo|postgres`, default `mongo`, whole process, not a tenant flag. Anything else (dual-read, per-tenant branch) is a different project.
2. **RLS.** Confirm we skip it and keep `id///tenant` as the guard. If we want RLS, we drop `connect-pg-simple` and write a store. I would not, for the reasons in the RLS section.
3. **Live sessions.** Confirm cutover does not copy Mongo sessions, so everyone signs in again. The alternative is dual-read.
4. **Sliding expiry.** Confirm we keep 14-day TTL and touch at most once per 24h (small wrapper). The alternative is a write on every authenticated request, which is what `connect-pg-simple` does unless `disableTouch` is on — and `disableTouch` stops sliding entirely.
5. **Payload.** Confirm `id///tenant` stays. An object would be clearer and would survive a tenant name that contains `///`. Changing it either drops old sessions (already the proposal) or needs a reader for both shapes.
6. **Tenant column for deletion.** Do we need "remove every session for tenant X" (offboarding)? If yes, a `tenant_id` column or a generated column belongs in the first migration. If no, `sid` + `sess` + `expire` is enough.

## Decisions

None confirmed yet. Proposals, pending the questions:

| Topic | Proposal |
| --- | --- |
| Store | `connect-pg-simple` on `PostgresDB.pool()` |
| Flag | `SESSIONS_BACKEND`, default `mongo` |
| RLS | No |
| Tenant guard | Existing `///` check, unchanged |
| Existing rows | Not migrated |
| TTL / touch | 14 days, touch at most once per 24h |
| Table | `http_sessions`, our SQL migration |
| Domain module | No |

## Progress

- **2026-09-23** — Analysis and this plan. No code.
