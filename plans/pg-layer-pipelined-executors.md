# Plan: Postgres layer on pipelined executors (one round trip per statement)

Goal: every tenant statement costs 1 round trip outside a transaction, and N + 1 (the +1 is `COMMIT`)
inside `run()`. The transaction manager gets simpler, and the knex-internals subclasses go away.

Locked decisions (do not re-open):
- knex only **compiles** SQL for tenant traffic (`toSQL()`); `pg` sends it, through a `pg.Pool` with
  `pipeline: true`. Every value stays a bound parameter.
- Outside `run()`: `BEGIN · set_config · statement · COMMIT` go out in one write (AutoCommitExecutor).
- Inside `run()`: one connection, taken at the first statement, released after `COMMIT`/`ROLLBACK`.
  `BEGIN` + context go out with the first statement; `set_config` goes out again only when the
  permission changes, in the same write as the next statement (TransactionExecutor).
- `runReadOnly` and the `@ReadTransaction` decorator are removed (spike: equal round trips, up to
  33% more throughput without it when the pool is the bottleneck).
- Sync logs stay app-written (`SyncLogWriter`, `entitySyncLogging`), moved onto Statements.
  Triggers / CTE-based sync logging → separate issue, not this plan.
- Non-tenant knex users stay on knex execution, on a plain `knex({ client: 'pg' })`: queue worker
  (`workerKnex`), `PostgresTenantsDataSource`, `copyTenants`, `copyHttpSessions`, migration knex
  instances. HTTP sessions keep their `pg.Pool`. Only the queue's dispatch path
  (`PostgresQueueAdapter.onDispatchConnection` with a transaction manager) moves to Statements.
- Nothing in production listens to knex `'query'` events; specs that do switch to an executor hook.
- `TransactionManager` contract keeps `run`, `onCommitted`, `onRetry`, `runHandlingOnCommitted`,
  `isRunning`, `getSession`. Mongo path unchanged.
- Behaviour changes accepted: a statement sent after `COMMIT` started fails ("transaction closed");
  concurrent statements in a failed transaction rethrow the first error, not `25P02`.

Spike evidence and scripts: `/tmp/claude-1000/-home-joao-code-huridocs-uwazi/3ff81d5a-e625-418c-9d7a-46ef3da802e3/scratchpad/spike/`
(spike1: pipeline semantics through PgBouncer, 16/16; spike2: read-only vs autocommit).

Order: Steps 1–2 change the API callers use while keeping today's execution. Step 3 builds the new
execution, unwired. Step 4 swaps it in. Each step leaves the tree green.

---

## Step 1: Route every PostgresTable terminal through a Statement

**Files:** app/api/core/infrastructure/postgresql/common/Statement.ts (new),
app/api/core/infrastructure/postgresql/common/PostgresTransactionManager.ts,
app/api/core/infrastructure/postgresql/common/PostgresTable.ts,
app/api/core/infrastructure/postgresql/common/PostgresPermissionEnforcedTable.ts,
app/api/core/infrastructure/postgresql/common/PostgresResultSet.ts,
app/api/core/infrastructure/postgresql/common/specs/PostgresTable.spec.ts,
app/api/core/infrastructure/postgresql/common/specs/PostgresPermissionEnforcedTable.spec.ts

**Skeleton:**
```ts
// Statement.ts
type StatementPermission = PermissionContext | 'inherit'; // 'inherit' = today's preservePermission
type Statement = { sql: string; bindings: readonly unknown[]; permission: StatementPermission };
type StatementResult<TRow = Record<string, unknown>> = { rows: TRow[]; rowCount: number };
const sqlBuilder: Knex; // knex({ client: 'pg' }) with no connection: compiles only
class Statements {
  static fromBuilder(qb: Knex.QueryBuilder, permission: StatementPermission): Statement // qb.toSQL()
  static raw(sql: string, bindings: readonly unknown[], permission: StatementPermission): Statement
}

// PostgresTransactionManager (temporary bodies over withConnection + trx.raw)
query<TRow>(statement: Statement): Promise<StatementResult<TRow>>
queryAll(statements: Statement[]): Promise<StatementResult[]> // all in one transaction
stream<TRow>(statement: Statement): AsyncGenerator<TRow, void, unknown>
```

**Do:**
- Statement keeps knex's `?` placeholders (`toSQL()`, not `toNative()`); executors convert to `$n` in Step 3.
- Build every terminal of `PostgresTable` (`first`, `all`, `count`, `sum`, `insert`, `upsert`, `update`,
  `bulkUpdate`, `delete`, `raw`, `stream`) as a Statement from `sqlBuilder(tableName)` and send it with
  `transactionManager.query` / `stream`. Never `.transacting(trx)` again.
- Shape results in the table from `rows` / `rowCount`: `first` → `rows[0]` (add `limit 1`), `count` /
  `sum` → parse `rows[0]`, `insert`/`upsert`/`update`/`delete` → `RETURNING "_id"` ids. `raw()` returns
  `StatementResult<TResult>`; its 33 callers read `.rows` already.
- `PostgresPermissionEnforcedTable.upsert`: its statement carries `{ bypass: true, refIds: [] }`;
  `insertIgnoringConflicts` carries the actor's permission.
- Sync-log emission (`notifySync`, `emitSyncLogs`) unchanged in this step.
- `PostgresResultSet` takes its rows from `transactionManager.stream`.

**Test:** existing `PostgresTable.spec.ts` and `PostgresPermissionEnforcedTable.spec.ts` are the
contract; add cases for each terminal's shape where missing (`first` on no row, `count` of 0,
`delete` ids, `upsert` returning nothing for an unauthorized row, ObjectId bindings) — run
`yarn test app/api/core/infrastructure/postgresql/common/specs`, then the Postgres folders of
csv.v2, paragraphExtraction, dataviz.v2, suggestions, sync (batched).

---

## Step 2: Move the direct `withConnection` callers onto Statements

**Files:** app/api/core/infrastructure/postgresql/common/SyncLogWriter.ts,
app/api/core/infrastructure/postgresql/common/entitySyncLogging.ts,
app/api/core/infrastructure/postgresql/sync/PostgresSyncs.ts,
app/api/core/infrastructure/postgresql/preserve/PostgresPreserveSync.ts,
app/api/core/infrastructure/postgresql/migrations/MigrateCollectionToPostgres.ts,
app/api/core/infrastructure/postgresql/migrations/configs/copyUpdateLogs.ts,
app/api/core/libs/queue/infrastructure/PostgresQueueAdapter.ts,
app/api/core/infrastructure/postgresql/settings/CachedPostgresSettingsDataSource.ts,
app/api/core/infrastructure/postgresql/common/PostgresTransactionManager.ts

**Skeleton:**
```ts
// PostgresQueueAdapter
private async dispatch(statements: Statement[]): Promise<StatementResult[]> // TM.queryAll, or workerKnex when no TM
// SyncLogWriter / readUpdateLogs: same signatures, statements with permission 'inherit'
```

**Do:**
- `SyncLogWriter.upsertSyncLogs`, `readUpdateLogs`, `PostgresSyncs`, `PostgresPreserveSync`: build with
  `sqlBuilder` / `Statements.raw`, permission `'inherit'`, send with `query`.
- `entitySyncLogging.afterSyncLog`: two dependent `query` calls (entities → files) with the actor's
  permission, then `upsertSyncLogs`. Same round trips as today; reducing them is the sync issue.
- `PostgresQueueAdapter`: with a transaction manager, compile with `sqlBuilder` and send the chunks
  with `queryAll` (atomic, replaces `db.transaction(insertInChunks)`); without one, keep `workerKnex`.
- Migration helpers: replace `withConnection(trx => ...)` with `query` / `queryAll` on the
  `PostgresTransactionManager` they construct.
- `CachedPostgresSettingsDataSource`: delete `readWholeRow`; cache `super.readRow()`. Delete
  `readWithoutBindings` from the transaction manager.
- Make `withConnection` and `beginTransaction` private; `grep -rn "withConnection(" app/api` outside
  `PostgresTransactionManager.ts` must be empty.

**Test:** `SyncLogWriter.spec.ts`, `CachedPostgresSettingsDataSource.spec.ts` (drop the
`readWithoutBindings` statement-count case; keep "read once per request"), the queue adapter specs
(`yarn test app/api/core/libs/queue`), the sync and preserve specs, `migrations/configs/specs` —
run each folder, then `yarn check-types`.

---

## Step 3: Build SessionContext, the executors and the pipelined pool (unwired)

**Files:** app/api/core/infrastructure/postgresql/common/PostgresSessionContext.ts,
app/api/core/infrastructure/postgresql/common/Executor.ts (new),
app/api/core/infrastructure/postgresql/common/AutoCommitExecutor.ts (new),
app/api/core/infrastructure/postgresql/common/TransactionExecutor.ts (new),
app/api/infrastructure/PostgresDB.ts,
app/api/core/infrastructure/postgresql/common/specs/AutoCommitExecutor.spec.ts (new),
app/api/core/infrastructure/postgresql/common/specs/TransactionExecutor.spec.ts (new)

**Skeleton:**
```ts
class PostgresSessionContext {
  constructor(tenantId: string)
  static normalize(permission?: Partial<PermissionContext>): PermissionContext
  static same(a: PermissionContext, b: PermissionContext): boolean
  statement(permission: PermissionContext): pg.QueryConfig // set_config($1,$2,$3) with bindings
}

interface Executor {
  query<TRow>(statement: Statement): Promise<StatementResult<TRow>>
  queryAll(statements: Statement[]): Promise<StatementResult[]>
  stream<TRow>(statement: Statement): AsyncGenerator<TRow, void, unknown>
}
type StatementListener = (sql: string) => void; // spec hook, replaces knex 'query' events

class AutoCommitExecutor implements Executor {
  constructor(pool: pg.Pool, context: PostgresSessionContext, onStatement?: StatementListener)
}
class TransactionExecutor implements Executor {
  constructor(pool: pg.Pool, context: PostgresSessionContext, onStatement?: StatementListener)
  commit(): Promise<void>
  rollback(): Promise<void>
}

// PostgresDB
static pipelinedPool(): pg.Pool          // app credentials, pipeline: true, max = knex's today (10)
static onStatement(listener: StatementListener): () => void // returns unsubscribe; specs only
```

**Do:**
- Convert `?` → `$n` once per statement (`sqlBuilder.raw(sql, bindings).toSQL().toNative()`).
- AutoCommit: checkout, send `BEGIN`, context, statement(s), `COMMIT` without awaiting in between,
  `Promise.allSettled`, rethrow the first rejection, release (pass the error to `release` when the
  socket died). `'inherit'` resolves to the default context outside a transaction.
- Transaction: lazy checkout guarded by one promise (concurrent first statements share it); remember
  the last permission sent; send `set_config` only when `same()` is false; `'inherit'` sends nothing.
  Keep the first error and rethrow it from later statements and `commit()`. After `commit()` /
  `rollback()` starts, `query` rejects with "transaction closed".
- Attach a rejection handler to every query not awaited by a caller (`BEGIN`, `set_config`).
- `stream`: pg-query-stream on the executor's connection (AutoCommit: dedicated checkout with
  `BEGIN`·context first, `COMMIT` when exhausted, `ROLLBACK` on break/error).
- Session context drops `beginSql`, `markApplied`, `open`, `switch`, the `WeakMap`, and `literal()`.
- `PostgresDB.connect()` back to `client: 'pg'` comes in Step 4, not here.

**Test:** new executor specs against the real database (`testingEnvironment.setUp` with Postgres),
porting the spike checks: the statements a write sends, in order (via `onStatement`), RLS per
tenant/anonymous/bypass, no context leak across
200 concurrent checkouts, error mid-pipeline → first error rethrown and `ROLLBACK`, `40001` surfaces on
the statement's promise, `statement_timeout` leaves the connection usable, closed transaction rejects,
permission switch sends one `set_config`, `'inherit'` sends none, stream of 250 rows in batches, and
**a stream inside a transaction with writes issued from the loop** (find out; if it deadlocks, make
`stream` inside a transaction reject with a clear error and record it) — run
`yarn test app/api/core/infrastructure/postgresql/common/specs`.

---

## Step 4: Swap the transaction manager onto the executors and delete the workarounds

**Files:** app/api/core/infrastructure/postgresql/common/PostgresTransactionManager.ts,
app/api/core/infrastructure/factories/PostgresTransactionManagerFactory.ts,
app/api/infrastructure/PostgresDB.ts,
app/api/core/infrastructure/postgresql/migrations/MigrateCollectionToPostgres.ts,
app/api/core/infrastructure/postgresql/migrations/configs/copyUpdateLogs.ts,
deleted: TransactionJoinLock.ts, TransactionBorrows.ts, PgClientWithContextBegin.ts,
TransactionWithContextBegin.ts, knexPgClient.d.ts, knexPgTransaction.d.ts (all in postgresql/common),
specs: PostgresTransactionManager.spec.ts, RelationshipsV1DataSource.spec.ts, entitiesDAO.spec.ts,
CachedPostgresSettingsDataSource.spec.ts

**Skeleton:**
```ts
class PostgresTransactionManager implements TransactionManager {
  constructor(pool: pg.Pool, tenantId: string, logger: Logger)
  executor(): Executor                    // active TransactionExecutor, else AutoCommitExecutor
  query / queryAll / stream               // delegate to executor()
  run<T>(callback: () => Promise<T>): Promise<T> // new TransactionExecutor per attempt; retry 40001/40P01
  onCommitted / onRetry / runHandlingOnCommitted / isRunning / getSession // unchanged behaviour
}
```

**Do:**
- Remove `withConnection`, `beginTransaction`, `reuseActiveTransaction`, `prepareJoinedTransaction`,
  `openTransaction`, `joinActiveTransaction`, `finishCommit`/`finishRollback` borrow draining.
- `run()` while running still throws "Transaction already in progress."
- Factory and migration helpers pass `PostgresDB.pipelinedPool()` instead of `PostgresDB.knex`.
- `PostgresDB.connect()` uses `client: 'pg'`; `PostgresDB.knex` stays for the non-tenant users.
- Specs counting statements switch from `PostgresDB.knex.on('query')` to `PostgresDB.onStatement`.

**Test:** `PostgresTransactionManager.spec.ts` rewritten on `onStatement`: standalone read and write
each send `BEGIN, set_config, statement, COMMIT` as one batch; `run()` with 2 statements sends
`BEGIN, set_config, s1`, then `s2`, then `COMMIT`; permission switch inside `run()` adds one
`set_config`; retry on `40001` reruns the callback with a fresh executor and runs `onRetry`; commit
handlers run after commit. Then all Postgres specs, batched: `app/api/core/infrastructure/postgresql`,
`app/api/core/application/specs`, and the `postgresql/` folders of csv.v2, paragraphExtraction,
dataviz.v2, suggestions, queue, tenants, sync.

---

## Step 5: Remove `runReadOnly` and the `@ReadTransaction` decorator

**Files:** app/api/core/application/contracts/TransactionManager.ts,
app/api/core/infrastructure/postgresql/common/PostgresTransactionManager.ts,
app/api/core/infrastructure/mongodb/common/MongoTransactionManager.ts,
app/api/core/infrastructure/factories/PostgresTransactionManagerFactory.ts,
app/api/core/infrastructure/factories/TransactionManagerFactory.ts,
app/api/core/infrastructure/express/entity/GetEntityController.ts,
deleted: app/api/core/libs/ReadTransaction.ts, app/api/core/libs/specs/ReadTransaction.spec.ts

**Skeleton:** none — deletions only.

**Do:**
- Drop `runReadOnly` from the contract, both implementations and the two test mocks.
- Remove `@ReadTransaction()` from `GetEntityController`.
- `grep -rn "runReadOnly\|ReadTransaction" app/` must be empty.

**Test:** `yarn check-types`; the GetEntity controller/use case specs and
`app/api/core/infrastructure/specs/entitiesDAO.spec.ts` — run them.

---

## Step 6: Verify and record results

**Files:** none (results go in the PR description)

**Do:**
- `yarn check-types`, `yarn lint --type-aware` on touched paths, `yarn prettier` on touched files.
- Bench (`bench-pg18` + `bench-pgb`, 0.5 ms netem): statements per `GET /api/entities` via
  `log_statement=all`; `runall.sh` and `burnrun.sh` for `mongo` and `pg`; compare against the
  #9946 numbers.
- Count round trips for a standalone write and for a `run()` with 2 writes on a non-sync-logged
  table (expect 1 and 3).
- Open the separate issue: sync logging in one statement (data-modifying CTE or triggers), with
  the costs left after this plan (sync-logged write 2 round trips, entity write ~4).

**Test:** this step is the verification; no regression in any Postgres spec.
