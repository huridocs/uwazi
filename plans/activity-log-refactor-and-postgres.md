# Plan: Activity log — refactor into `packages/activitylog`, then Postgres (issue #9681)

PRs: **A** (refactor, Mongo only, behaviour unchanged) = Steps 1–5 · **B** (Postgres) = Steps 6–8 · **C** (archiving) = Steps 9–10.

Locked decisions (do not re-open):
- Refactor first; Postgres is adapters only. Wire contract (`app/shared/types/activityLog*`) and `GET /api/activitylog` behaviour do not change.
- No query use case. `ActivityLogQueryService` gains `list()`; the controller calls it directly.
- Describer + route catalog are injected into both query service adapters; `list()` returns described rows. Descriptions stay read-time.
- Domain model is thin: immutable `ActivityLogEntry`, creation owns redaction. Nothing more.
- Archives are stored as V1 stored its per-request files: `storage.storeFile(name, stream, 'activitylog')` from `#api/files`. Core `FileStorage` cannot write to the `activityLogs` folder without a `BaseFile`. No module-own storage contract.
- Per-request file (`{tenant}_{time}_activity.log`) is removed.
- Search stays pattern matching over text. `body`/`query`/`params` are `TEXT`, never `JSONB` (filters match on `{"_id"` prefix).
- Gated by `postgresCore`. Plain shared table + RLS, no partitioning.
- Retention: Mongo tenants keep the 1y TTL. Postgres has no time bound: keep 50,000 rows per tenant, archive overflow oldest-first in files of 10,000 rows, then delete. Count, not MB. Cap is a system setting (`ACTIVITY_LOG_MAX_ROWS`), not a tenant flag.
- Archiving is triggered by a daily system job on the queue. No CLI command.
- Copy to Postgres drops `expireAt`.
- Screen shows database rows only. Reading archives back is out of scope.
- `app/api/migrations/logger.js` and `activitylogModel.js` are left alone.

Out of scope (follow-up issue): write-time descriptions, `pg_trgm`/ParadeDB search, ignoring `POST /api/suggestions/status`, archive recovery UI.

Every step ends with: `yarn check-types` · `yarn lint --type-aware packages/activitylog <other touched paths>` · `yarn prettier --write <touched files>`.

---

## Step 1: Add the entry model and the record use case

**Files:** packages/activitylog/domain/ActivityLogEntry.ts, packages/activitylog/domain/specs/ActivityLogEntry.spec.ts, packages/activitylog/application/RecordActivity.ts, packages/activitylog/application/contracts/ActivityLogDataSource.ts, packages/activitylog/application/specs/RecordActivity.spec.ts, packages/activitylog/infrastructure/mongodb/MongoActivityLogDataSource.ts, packages/activitylog/infrastructure/mongodb/MongoActivityLogDBO.ts, packages/activitylog/infrastructure/factories/ActivityLogDataSourceFactory.ts, packages/activitylog/infrastructure/factories/RecordActivityFactory.ts

**Skeleton:**
```ts
type ActivityLogEntryProps = {
  id: string; method: string; url: string;
  params: string; query: string; body: string;      // JSON strings, as stored today
  userId: string | null; username: string | null;
  time: number;                                      // epoch ms
};

class ActivityLogEntry {
  static record(input: RecordInput, id: string, now: number): ActivityLogEntry  // masks body.password, stringifies
  static restore(props: ActivityLogEntryProps): ActivityLogEntry
  get props(): Readonly<ActivityLogEntryProps>
}

type RecordInput = {
  method: string; url: string;                       // url without query string
  params: unknown; query: unknown; body: Record<string, unknown>;
  user: { id: string; username: string } | null;
  statusCode: number;
};

interface ActivityLogDataSource { append(entry: ActivityLogEntry): Promise<void> }

class RecordActivity extends AbstractUseCase<RecordInput, void, Deps> {
  static readonly IGNORED_ENDPOINTS: readonly string[]
  static readonly BODY_REQUIRED_ENDPOINTS: readonly string[]
  execute(input: RecordInput): Promise<void>         // skips 404, ignored methods/endpoints, empty required body
}
```

**Do:**
- Move `mustBeLogged` + both endpoint lists from `app/api/activitylog/activitylogMiddleware.ts` into `RecordActivity`, unchanged.
- `MongoActivityLogDataSource.append` writes the same document shape as today, including `expireAt = time + 1 year` (Mongo-only concern, lives in the adapter) and `user` as `ObjectId`.
- Factory: Mongo only for now, shaped like `packages/ocr/infrastructure/factories/OcrRecordDataSourceFactory.ts`.

**Test:** unit spec for `ActivityLogEntry` (password masked, nested untouched, anonymous user); integration spec for `RecordActivity` through its factory asserting the raw `activitylogs` document and each skip rule — run `yarn test packages/activitylog/domain packages/activitylog/application/specs/RecordActivity.spec.ts`

---

## Step 2: Move the middleware into the package and drop the per-request file

**Files:** packages/activitylog/infrastructure/http/ActivityLogMiddleware.ts, packages/activitylog/infrastructure/http/specs/ActivityLogMiddleware.spec.ts, packages/activitylog/composition.ts, package.json, tsconfig.json, app/jest.server.config.json, app/api/api.js, app/api/entities/routes.js, app/api/files/routes.ts, app/api/files/jsRoutes.js, app/api/customUploads/infrastructure/http/routes.ts, app/api/activitylog/activitylogMiddleware.ts (delete), app/api/activitylog/specs/activitylogMiddleware.spec.js (delete after porting)

**Skeleton:**
```ts
class ActivityLogMiddleware {
  static handle(req: Request, res: Response, next: NextFunction): void  // attach-once guard, logs on 'finish'
}

class ActivityLogComposition {
  static readonly middleware: RequestHandler
  static registerRoutes(app: Application): void       // filled in Step 5
}
```

**Do:**
- Middleware only extracts `RecordInput` from `req`/`res` and calls `RecordActivityFactory.default().execute(...)`; errors still go to `handleError(e, { req })`, never to the client.
- Remove the `storage.storeFile(..., 'activitylog')` call. Leave `FileType`, `PathManager` and `tenant.activityLogs` in place (Step 9 uses them).
- Add alias `#activitylog/composition` in `package.json`, `tsconfig.json`, `app/jest.server.config.json`, mirroring `#ocr/composition`.
- Point the five importers at `ActivityLogComposition.middleware`. Keep the per-route attachments as they are.

**Test:** port every case of `activitylogMiddleware.spec.js` to the new spec, replacing the storage assertion with "no file is written" — run `yarn test packages/activitylog/infrastructure/http app/api/entities/specs/routes.spec app/api/files/specs`

---

## Step 3: Port the describer and the route catalog

**Files:** packages/activitylog/application/ActivityCatalog.ts, packages/activitylog/application/ActivityDescriber.ts, packages/activitylog/application/ActivityDescription.ts, packages/activitylog/application/specs/ActivityDescriber.spec.ts, packages/activitylog/application/specs/ActivityCatalog.spec.ts, packages/activitylog/infrastructure/RelatedDataLoader.ts, packages/activitylog/infrastructure/factories/ActivityDescriberFactory.ts

**Skeleton:**
```ts
type ActivityAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'MIGRATE' | 'RAW' | 'WARNING';

type ActivityDescription = {
  action: ActivityAction; description: string;
  name?: string; extra?: string; errorStack?: string;
};

type RouteDescriptor = { desc: string; method?: ActivityAction; idField?: string; nameField?: string; /* … as EntryValue */ };

class ActivityCatalog {
  static readonly routes: Readonly<Record<string, RouteDescriptor>>             // today's ParsedActions, keys unchanged
  static routesForActions(actions: string[]): { method: string; url: string }[]  // from ActivityLogFilter.methodFilter
  static routesDescribedAs(search: string): { method: string; url: string }[]    // from openSearchFilter
}

class ActivityDescriber {
  constructor(deps: { related: RelatedDataLoader })
  describe(entry: ActivityLogEntryReadModel): Promise<ActivityDescription>      // never throws → WARNING
}

class RelatedDataLoader {           // today's helpers.js loaders, same collaborators
  loadEntity(data): Promise<…>; loadTemplate(data): Promise<…>; loadFile(data): Promise<…>;
  loadPermissionsData(data): Promise<…>; loadSuggestionData(data): Promise<…>;
  loadExtractorData(data): Promise<…>; loadUser(data): Promise<…>; loadEntityFromPublicForm(data): Promise<…>;
}
```

**Do:**
- Port `activitylogParser.ts`, `activityLogBuilder.ts`, `helpers.js`, `migrationsParser.js` to TS with identical output, including stale keys (`setasdeafult`, `/api/upload`) and the `MIGRATE` branch.
- Pure formatters go on the describer/catalog; anything that reads another module goes in `RelatedDataLoader`, wired in the factory.
- Do not delete the legacy files yet (Step 5).

**Test:** port `activitylogParser.spec.js` and `migrationsParser.spec.js` (with `fixturesParser.js`) case by case — run `yarn test packages/activitylog/application/specs/ActivityDescriber.spec.ts packages/activitylog/application/specs/ActivityCatalog.spec.ts`

---

## Step 4: Extend the query service with `list()`

**Files:** packages/activitylog/application/contracts/ActivityLogQueryService.ts (moved from package root), packages/activitylog/application/ActivityLogListing.ts, packages/activitylog/application/specs/ActivityLogQueryService.spec.ts (moved from packages/activitylog/specs), packages/activitylog/application/specs/ActivityLogContractFixtures.ts, packages/activitylog/infrastructure/mongodb/MongoActivityLogQueryService.ts, packages/activitylog/infrastructure/mongodb/MongoActivityLogFilter.ts, packages/activitylog/infrastructure/factories/ActivityLogQueryServiceFactory.ts, packages/activitylog/index.ts

**Skeleton:**
```ts
type ActivityLogFilters = {
  username?: string; find?: string; search?: string;
  actions?: string[];                                  // wire `method`
  time?: { from?: number; to?: number }; before?: number;
  url?: string; query?: string; body?: string; params?: string;
  sort?: { prop: 'method' | 'time' | 'username' | 'url'; asc: boolean };
  page?: number; limit?: number;                       // default 15
};

type DescribedActivityLogEntry = ActivityLogEntryReadModel & { semantic: ActivityDescription };

type ActivityLogPage = {
  rows: DescribedActivityLogEntry[];
  totalRows: number; remainingRows: number; limit: number; page?: number;
};

interface ActivityLogQueryService {
  recent(query: { limit: number }): Promise<ActivityLogEntry[]>;   // unchanged, CLI
  list(filters: ActivityLogFilters): Promise<ActivityLogPage>;
}

class MongoActivityLogQueryService {
  constructor(db: Db, describer: ActivityDescriber)
}

class MongoActivityLogFilter { static build(filters: ActivityLogFilters): Filter<MongoActivityLogDBO> }
```

**Do:**
- Port `activityLogFilter.ts` + the paging/sort/`anonymous` logic of `activitylog.js` into `MongoActivityLogFilter`/`list()`; use `ActivityCatalog` for the action/search → route translation. Keep the `en`/strength-2 collation.
- `index.ts` keeps exporting the same names so `apps/cli/activity/controllers/ListActivityController.ts` is untouched.
- No Mongo/driver type in the contract file.

**Test:** contract spec run over `[mongo]` (Postgres joins in Step 7), order-insensitive except where sort is the assertion; port `activitylog.spec.js` and `activityLogFilter.spec.ts` cases (fixtures as plain data in `ActivityLogContractFixtures.ts`) — run `yarn test packages/activitylog/application/specs/ActivityLogQueryService.spec.ts apps/cli/activity`

---

## Step 5: Serve the route from the package and delete the legacy module

**Files:** packages/activitylog/infrastructure/http/ActivityLogRoutes.ts, packages/activitylog/infrastructure/http/ListActivityLogController.ts, packages/activitylog/infrastructure/http/ActivityLogWireMapper.ts, packages/activitylog/infrastructure/http/specs/routes.spec.ts, packages/activitylog/composition.ts, app/api/api.js, app/api/activitylog/ (delete all but `activitylogModel.js`)

**Skeleton:**
```ts
class ActivityLogRoutes { static register(app: Application): void }   // GET /api/activitylog, admin, parseQuery, ActivityLogGetRequestSchema

class ListActivityLogController { static handle(query: ActivityLogGetRequest['query']): Promise<ActivityLogResponse> }

class ActivityLogWireMapper {
  static toFilters(query: ActivityLogGetRequest['query']): ActivityLogFilters
  static toResponse(page: ActivityLogPage): ActivityLogResponse       // _id, user, method… exactly as today
}
```

**Do:**
- `api.js`: replace `./activitylog/routes.js` with `ActivityLogComposition.registerRoutes(app)`.
- Delete `activitylog.js`, `activityLogFilter.ts`, `activitylogParser.ts`, `activityLogBuilder.ts`, `helpers.js`, `migrationsParser.js`, `routes.js` and their specs/fixtures once nothing imports them (`git grep "api/activitylog/"`).
- Keep `activitylogModel.js` (used by `app/api/migrations/logger.js`).

**Test:** port `routes.spec.js` (auth, validation, response shape) — run `yarn test packages/activitylog`; manual check: `yarn hot`, Settings > Activity Log lists, filters, sorts and opens an entry (covers `cypress/e2e/settings/activitylog.cy.ts`)

---

## Step 6: Create the `activitylogs` table

**Files:** app/api/core/infrastructure/postgresql/schema_migrations/0NN-create-activitylogs-table.sql (scaffold with `yarn add-migration schema create-activitylogs-table "<desc>"`), its generated spec

**Skeleton:**
```sql
CREATE TABLE IF NOT EXISTS activitylogs (
  "_id" TEXT NOT NULL, "tenant_id" TEXT NOT NULL,
  "method" TEXT NOT NULL, "url" TEXT NOT NULL,
  "params" TEXT NOT NULL, "query" TEXT NOT NULL, "body" TEXT NOT NULL,
  "user_id" TEXT, "username" TEXT,
  "time" BIGINT NOT NULL,
  PRIMARY KEY ("tenant_id", "_id")
);
-- indexes: (tenant_id, time DESC, _id DESC) · (tenant_id, method) · (tenant_id, url) · (tenant_id, lower(username))
-- RLS: ENABLE + tenant_isolation policy, as 032-create-updatelogs-table.sql
```

**Do:**
- No `expireAt`, no partitions.
- Read `docs/backend/migrations.md` before scaffolding.

**Test:** fill the generated spec (table, columns, indexes, policy exist; a second tenant cannot read the first's row) — run `yarn test <generated spec path>`

---

## Step 7: Add the Postgres adapters

**Files:** packages/activitylog/infrastructure/postgresql/PostgresActivityLogRow.ts, packages/activitylog/infrastructure/postgresql/PostgresActivityLogMapper.ts, packages/activitylog/infrastructure/postgresql/PostgresActivityLogDataSource.ts, packages/activitylog/infrastructure/postgresql/PostgresActivityLogQueryService.ts, packages/activitylog/infrastructure/postgresql/PostgresActivityLogFilter.ts, packages/activitylog/infrastructure/factories/ActivityLogDataSourceFactory.ts, packages/activitylog/infrastructure/factories/ActivityLogQueryServiceFactory.ts, packages/activitylog/application/specs/ActivityLogDataSource.spec.ts, packages/activitylog/application/specs/ActivityLogQueryService.spec.ts, packages/activitylog/application/specs/RecordActivity.spec.ts

**Skeleton:**
```ts
class PostgresActivityLogDataSource extends PostgresDataSource<PostgresActivityLogRow> implements ActivityLogDataSource {
  append(entry: ActivityLogEntry): Promise<void>
}

class PostgresActivityLogQueryService implements ActivityLogQueryService {
  constructor(deps: PostgresDataSourceDeps & { describer: ActivityDescriber })
  recent(query: { limit: number }): Promise<ActivityLogEntry[]>
  list(filters: ActivityLogFilters): Promise<ActivityLogPage>
}

class PostgresActivityLogFilter { static apply(query: QueryBuilder, filters: ActivityLogFilters): QueryBuilder }
```

**Do:**
- Factories choose on `tenant.featureFlags?.postgresCore`; outside an execution context use `PostgresTransactionManagerFactory.default()` (the middleware writes after the response has finished).
- Translate each Mongo pattern to its Postgres equivalent (`~`, `~*`, including the negative lookahead for CREATE); sort by `lower(username)` to match the Mongo collation; tie-break `time DESC, _id DESC`.
- New ids: same generator the other Postgres data sources use; copied rows keep their Mongo hex id.

**Test:** run the Step 4 contract spec, the new `ActivityLogDataSource` contract spec and `RecordActivity.spec.ts` over `[mongo, postgres]` with shared fixtures — run `yarn test packages/activitylog apps/cli/activity`

---

## Step 8: Copy existing rows to Postgres

**Files:** app/api/core/infrastructure/postgresql/migrations/configs/ActivityLogsMigrationConfig.ts, app/api/core/infrastructure/postgresql/migrations/configs/index.ts, app/api/core/infrastructure/postgresql/migrations/configs/specs/ (spec per sibling configs), scripts/migrationStatus.mjs

**Skeleton:**
```ts
export const ActivityLogsMigrationConfig: MigrationConfig = {
  mongoCollection: 'activitylogs',
  pgTable: 'activitylogs',
  conflictColumns: ['tenant_id', '_id'],
  mapDocument(doc: Record<string, unknown>): Record<string, unknown>   // _id/user → hex, drops expireAt, null-safe strings
};
```

**Do:**
- Declare the document shape locally; import nothing from `packages/activitylog`.
- Handle legacy shapes: missing `params`/`query`/`body`, `user: null`, `username: 'System'` `MIGRATE` rows.
- Confirm re-running is a no-op (conflict columns), so rows written during the copy window can be caught by a second run.
- Set `activitylog` to tracked in `scripts/migrationStatus.mjs` if that is how sibling modules are marked.

**Test:** spec with old-shape fixtures → asserts raw Postgres rows, re-run idempotent, empty collection — run `yarn test app/api/core/infrastructure/postgresql/migrations/configs/specs`

---

## Step 9: Archive overflow rows to storage

**Files:** app/api/config.ts, packages/activitylog/application/ActivityLogArchive.ts, packages/activitylog/application/specs/ActivityLogArchive.spec.ts, packages/activitylog/application/ArchiveActivityOverflow.ts, packages/activitylog/application/specs/ArchiveActivityOverflow.spec.ts, packages/activitylog/application/specs/ActivityLogDataSource.spec.ts, packages/activitylog/application/contracts/ActivityLogDataSource.ts, packages/activitylog/infrastructure/postgresql/PostgresActivityLogDataSource.ts, packages/activitylog/infrastructure/mongodb/MongoActivityLogDataSource.ts, packages/activitylog/infrastructure/factories/ArchiveActivityOverflowFactory.ts

**Skeleton:**
```ts
// config.ts — a system setting, not a tenant one
activityLog: { maxRows: number }            // ACTIVITY_LOG_MAX_ROWS, default 50_000

interface ActivityLogDataSource {
  append(entry: ActivityLogEntry): Promise<void>;
  count(): Promise<number>;
  oldest(limit: number): Promise<ActivityLogEntry[]>;       // time ASC, id ASC
  remove(entries: ActivityLogEntry[]): Promise<void>;
}

class ActivityLogArchive {                                  // not a BaseFile
  static of(entries: ActivityLogEntry[]): ActivityLogArchive // gzipped JSONL, name from first/last entry
  readonly filename: string; content(): Readable
}

type ArchiveOutput = { archivedRows: number; files: string[] };

class ArchiveActivityOverflow extends AbstractUseCase<void, ArchiveOutput, Deps> {
  static readonly CHUNK_ROWS = 10_000;
  execute(): Promise<ArchiveOutput>
}
// Deps: { activityLogDS; storage: { storeFile(name, stream, 'activitylog') }; maxRows; chunkRows; enabled }
```

**Do:**
- Loop while `count - maxRows >= chunkRows`: take the oldest chunk, store it, then delete it. Never archive a partial chunk.
- File: gzipped JSONL, one raw entry per line, stored as V1 did — `storage.storeFile(name, stream, 'activitylog')` from `#api/files` — under the tenant's `activityLogs` folder, named from the chunk's first and last entry so a retry overwrites the same file.
- `enabled` is false for tenants not on `postgresCore` (factory reads the flag) → returns zeros; they keep the TTL.
- `maxRows` from `config.activityLog.maxRows`. No feature flag.

**Test:** unit spec for `ActivityLogArchive` (name, content round-trip); `ActivityLogDataSource` contract spec over `[mongo, postgres]` for `count`/`oldest`/`remove`; integration spec for the use case through its factory with small `maxRows`/`chunkRows` and tenant tmp storage: under cap → nothing; overflow below one chunk → nothing; two chunks → two files with the oldest rows, rows gone, newest kept; re-run after a failed delete overwrites the same file; Mongo tenant → no-op — run `yarn test packages/activitylog`

---

## Step 10: Run the archive daily from the queue

**Files:** packages/activitylog/infrastructure/jobs/ScheduleActivityLogArchivesJob.ts, packages/activitylog/infrastructure/jobs/ScheduleActivityLogArchivesJobScheduler.ts, packages/activitylog/infrastructure/jobs/ArchiveActivityOverflowJobHandler.ts, packages/activitylog/infrastructure/jobs/specs/, packages/activitylog/composition.ts, app/queueRegistry.ts, app/setupQueueWorker.ts, .oxlintrc.json

**Skeleton:**
```ts
@PrivilegedJob()
class ScheduleActivityLogArchivesJob implements Dispatchable {   // 'system' namespace, daily
  handleDispatch(heartbeat, params?, jobInfo?): Promise<void>
}

class ScheduleActivityLogArchivesJobScheduler { ensureScheduled(): Promise<void> }

@PrivilegedJob()
class ArchiveActivityOverflowJobHandler extends UwaziJobHandler { handle(): Promise<void> }  // tenant namespace

class ActivityLogComposition {
  static registerJobs(register: Register): void
  static ensureArchivingScheduled(): Promise<void>
}
```

**Do:**
- Follow `app/api/core/infrastructure/jobs/cleanupExpiredCaptchasJob/`: the job re-dispatches itself for the next day on success or final attempt; the scheduler dispatches it once if none is queued.
- The system job runs one query over the whole table (admin pool) for tenants holding at least `maxRows + CHUNK_ROWS` entries, and dispatches `ArchiveActivityOverflowJobHandler` into each of those tenants' namespaces.
- The tenant handler runs `ArchiveActivityOverflowFactory.default().execute()`.
- `setupQueueWorker.ts` calls `ensureArchivingScheduled()` next to the other system jobs (Mongo queue worker only, as they are); add it to the host files allowed to import `#activitylog/composition`.
- No CLI command.

**Test:** specs as `CleanupExpiredCaptchasJob.spec.ts` and its scheduler spec: only tenants over the threshold get a job; the job reschedules itself; the handler archives for its tenant — run `yarn test packages/activitylog`
