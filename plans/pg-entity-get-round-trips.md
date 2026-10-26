# Plan: Fewer Postgres round trips (combined BEGIN + context, two DAO queries, tenant hardening)

Goal: a typical `GET /api/entities` waits on ~9 round trips instead of 13 (Mongo: 9). In production one
round trip costs ~1.8 ms, of which 0.44 ms is Postgres working.

One PR for all steps.

Locked decisions (do not re-open):
- Option B: `BEGIN` and the session context (`set_config` for tenant, bypass flag, ref ids) go out
  as ONE plain-text message when a transaction opens. Pipelining (custom pg query object) is deferred.
- Only those context values are written into SQL text, escaped with `escapeLiteral` from `pg`. Every
  query keeps its values as bound parameters (`$1`…).
- No redesign of the layer in this work: unit of work, sync-log triggers, dropping `PostgresTable`,
  moving entity access rules out of the table class → a separate issue, not code.
- Data sources, DAOs, `PostgresTable`'s API and application code do not change (except Steps 2–3).
- Every statement keeps running under RLS with the same tenant and permission context as today.
- Read-only `COMMIT` stays where it is (already after the response).
- The Mongo path must behave exactly as today.

Round trips the request waits on, today → after:
- Standalone query (outside a transaction): `BEGIN` · `set_config` · query · `COMMIT` = 4 → 3.
- Opening a transaction: `BEGIN` · `set_config` = 2 → 1.
- `GET /api/entities`: 13 → 11 (Step 4) → 9 (Steps 2–3).

Bench stack (scratchpad `/tmp/claude-1000/-home-joao-code-huridocs-uwazi/954cf1ca-635d-47fc-a44d-8c7eb52a1c12/scratchpad/`):
`bench-pg18` (:5433), `bench-pgb` (PgBouncer :6432), netem 0.5 ms. Measure = `yarn production-build`,
`restart.sh pg POSTGRES_PORT=6432`, `runall.sh <label>`, `burnrun.sh <label>`, and statements per
request via `log_statement=all` on `bench-pg18`.

---

## Step 1: Make `current_tenant()` reject a missing or empty tenant

**Files:** app/api/core/infrastructure/postgresql/schema_migrations/037-current-tenant-rejects-empty.sql (via `yarn add-migration schema current-tenant-rejects-empty ...`), its spec next to the existing ones in app/api/core/infrastructure/postgresql/schema_migrations/specs/

**Skeleton:**
```sql
CREATE OR REPLACE FUNCTION public.current_tenant() RETURNS text LANGUAGE plpgsql STABLE AS $$ ... $$;
-- NULL or '' → RAISE EXCEPTION 'app.current_tenant is not set'
```

**Do:**
- Read `docs/backend/migrations.md` first. Scope `'global'`, same owner and grants as migration 004.
- Keep the function `STABLE` so policies stay index-friendly.
- Use `current_setting('app.current_tenant', true)`, so a never-set variable reaches the check instead of erroring differently.

**Test:** the spec asserts:
- A query on `entities` as `app_user` with no tenant set raises.
- With `set_config('app.current_tenant', '', true)` it raises.
- With a real tenant it returns rows.

Run `yarn test app/api/core/infrastructure/postgresql/schema_migrations`, then `yarn migrate --new` on the bench DB.

---

## Step 2: Load the entity and its files in one query

**Files:** app/api/core/infrastructure/postgresql/entity/PostgresEntitiesDAO.ts, app/api/core/infrastructure/specs/entitiesDAO.spec.ts

**Skeleton:**
```ts
class PostgresEntitiesDAO {
  private async getWithFiles(filters: EntityFilters, options: FileLoadOptions = {}): Promise<EntityWithFiles[]>
  // one SELECT: entities + correlated subquery json_agg(files) AS files
  // replaces entitiesForFiles() + filesDAO.getByEntitySharedIds()
}
```

**Do:**
- Keep the entity filters (`applyEntityFilters`), `select` and `limit`; aggregate the entity's files with `json_agg` (`'[]'` when none). Join on `f.tenant_id = e.tenant_id AND f.entity = e."sharedId"`.
- Same file columns as `PostgresFilesDAO` (`FILES_COLUMNS_WITHOUT_FULL_TEXT`, plus `fullText` only when `options.fullText`); map them through the existing files mapper.
- Split into documents and attachments exactly as `entitiesWithFiles` does today.

**Test:** in `entitiesDAO.spec.ts`:
- `find(..., { withFiles: true })` returns the same documents and attachments as before, including `fullText` on and off.
- One SELECT on Postgres, recorded the way `ReadTransaction.spec.ts` does (`recordStatements`).

Run `yarn test app/api/core/infrastructure/specs/entitiesDAO.spec.ts`.

---

## Step 3: Load an entity's hub connections in one query

**Files:** app/api/core/infrastructure/postgresql/relationships/PostgresRelationshipsV1DataSource.ts, app/api/core/application/specs/RelationshipsV1DataSource.spec.ts

**Skeleton:**
```ts
class PostgresRelationshipsV1DataSource {
  async getHubConnections(entitiesSharedIds: string[], options: HubConnectionsOptions = {}): Promise<V1Relationship[]>
  // SELECT * FROM connections WHERE hub IN (SELECT hub FROM connections WHERE entity IN (...) [file filters] [LIMIT 300])
}
```

**Do:**
- Merge the two `rawRows` calls into one statement, with the hub lookup as a subquery.
- Keep the `file` / `onlyTextReferences` branches and `LIMIT 300` inside the subquery.
- Keep the early `return []` for `onlyTextReferences && !file`.
- Follow `getHubConnectionsForEntity` in the same file.

**Test:** `RelationshipsV1DataSource.spec.ts` runs against both backends.
- Add the `file` and `onlyTextReferences` variants if missing.
- On Postgres, assert 1 SELECT.

Run `yarn test app/api/core/application/specs/RelationshipsV1DataSource.spec.ts`, then bench: expect 11 trips.

---

## Step 4: Send BEGIN and the session context in one message

**Files:** app/api/core/infrastructure/postgresql/common/PgClientWithContextBegin.ts (new), app/api/core/infrastructure/postgresql/common/PostgresSessionContext.ts, app/api/core/infrastructure/postgresql/common/PostgresTransactionManager.ts, app/api/infrastructure/PostgresDB.ts, app/api/core/infrastructure/postgresql/common/specs/PostgresTransactionManager.spec.ts

**Skeleton:**
```ts
// knex pg client whose transactions send "BEGIN [TRANSACTION READ ONLY]; SELECT set_config(...)" as one
// plain-text message when the transaction config carries userParams.sessionContextSql
class PgClientWithContextBegin extends Client_PG {
  transaction(container: unknown, config?: Knex.TransactionConfig, outerTx?: unknown): Knex.Transaction
}
class TransactionWithContextBegin extends Transaction_PG { begin(conn: unknown): Promise<unknown> }

class PostgresSessionContext {
  /** The set_config statement for a context, values escaped with pg's escapeLiteral. */
  beginSql(context: PermissionContext): string
  /** Records the context as applied without sending anything (it went out with BEGIN). */
  markApplied(trx: Knex.Transaction, context: PermissionContext): void
}
```

**Do:**
- `TransactionWithContextBegin.begin(conn)`: when `this.userParams?.sessionContextSql` is set, send `BEGIN …; <sessionContextSql>` through `this.query(conn, sql)` with no bindings; otherwise call `super.begin(conn)`. Keep `READ ONLY` and isolation-level handling exactly as `Transaction_PG` builds them.
- With no bindings, pg uses the plain-text protocol, which accepts several statements in one message. Add a spec that proves it.
- `beginSql` builds the same `set_config` statement `open` sends today (tenant, `bypass_rls`, `ref_ids`, `is_local = true`), every value through `escapeLiteral` (`import { escapeLiteral } from 'pg'`, pg 8.23). No other interpolation.
- `openTransaction(permissionContext, config)`: call `knex.transaction({ ...config, userParams: { sessionContextSql } })`, then `markApplied`. It no longer sends a separate `set_config`.
- `switch()` inside an open transaction is unchanged (still its own `set_config` when the context changes).
- Use `PgClientWithContextBegin` in `PostgresDB.connect()` only (`client: PgClientWithContextBegin`). The admin and migration knex instances stay on `'pg'`.
- `stream()` and `runReadOnly` go through `openTransaction`, so they get the saving with no change.

**Test:** in `PostgresTransactionManager.spec.ts`, recording knex `query` events:
- `withConnection` outside a transaction sends 3 statements: `BEGIN …; set_config(…)`, the query, `COMMIT`. Same for `runReadOnly` with `READ ONLY` kept in the first.
- Inside the transaction, `current_setting('app.current_tenant')`, `uwazi.bypass_rls` and `uwazi.ref_ids` read back the context.
- Injection: a tenant id and a ref id containing `'`, `\` and `;` are stored literally, and no extra statement runs.
- RLS is unchanged: anonymous sees only published entities, bypass sees all, another tenant sees none.
- An error after `BEGIN` rolls back, and the next transaction works.

Run `yarn test app/api/core/infrastructure/postgresql/common/specs app/api/core/libs/specs/ReadTransaction.spec.ts`. Update `ReadTransaction.spec.ts` if it matches the exact `BEGIN TRANSACTION READ ONLY;` string. Then bench: expect 11 → 9 trips with Steps 2–3.

---

## Step 5: Verify and record results

**Files:** none (results go in the PR description)

**Do:**
- Run `yarn check-types`, `yarn lint --type-aware` on the touched paths, and `yarn prettier` on the touched files.
- Run all Postgres specs, batched (no broad `app/api/core` run):
  - `app/api/core/infrastructure/postgresql`.
  - The `postgresql/` folders of csv.v2, paragraphExtraction, dataviz.v2, suggestions, queue and tenants.
- Bench before/after through PgBouncer:
  - Statements and round trips per `GET /api/entities` (expect 9 waited on).
  - `runall.sh`, `burnrun.sh` and `neighbor.sh`, for both `mongo` and `pg`.
- After deploy, watch in Prometheus:
  - Transaction time per transaction (7.3 ms today).
  - Queries per transaction (~4 today).
  - `pgbouncer_pools_client_waiting_connections`.

**Test:** this step is the verification. Expect no regression in any Postgres spec, and `GET /api/entities` latency closer to Mongo's under a busy event loop (70 ms Mongo vs 110 ms Postgres today).
