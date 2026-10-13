# Plan: Activity log — refactor into `packages/activitylog`, then Postgres (issue #9681)

PRs: **A** (refactor, Mongo only, behaviour unchanged) = Steps 1–5 · **B** (Postgres) = Steps 6–8 · **C** (archiving) = Steps 9–10.

Locked decisions (do not re-open):
- Refactor first; Postgres is adapters only. Wire contract (`app/shared/types/activityLog*`) and `GET /api/activitylog` behaviour do not change.
- No query use case. `ActivityLogQueryService` gains `list()`; the controller calls it directly.
- Describer + route catalog are injected into both query service adapters; `list()` returns described rows. Descriptions stay read-time.
- Domain model is thin: immutable `ActivityLogEntry`, creation owns redaction. Nothing more.
- Couple to core `FileStorage` + `FileStorageFactory` directly. No module-own storage contract.
- Per-request file (`{tenant}_{time}_activity.log`) is removed.
- Search stays pattern matching over text. `body`/`query`/`params` are `TEXT`, never `JSONB` (filters match on `{"_id"` prefix).
- Gated by `postgresCore`. Plain shared table + RLS, no partitioning.
- Retention: Mongo tenants keep the 1y TTL. Postgres has no time bound: keep 50,000 rows per tenant, archive overflow oldest-first in files of 10,000 rows, then delete. Count, not MB. Cap overridable by feature flag.
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

**Files:** app/api/tenants/featureFlags.ts, app/api/tenants/specs/featureFlags.spec.ts, packages/activitylog/application/ArchiveActivityOverflow.ts, packages/activitylog/application/specs/ArchiveActivityOverflow.spec.ts, packages/activitylog/application/contracts/ActivityLogDataSource.ts, packages/activitylog/infrastructure/postgresql/PostgresActivityLogDataSource.ts, packages/activitylog/infrastructure/mongodb/MongoActivityLogDataSource.ts, packages/activitylog/infrastructure/factories/ArchiveActivityOverflowFactory.ts

**Skeleton:**
```ts
// featureFlags.ts
activityLog: { maxRows: 'number' },

interface ActivityLogDataSource {
  append(entry: ActivityLogEntry): Promise<void>;
  count(): Promise<number>;
  oldest(limit: number): Promise<ActivityLogEntry[]>;       // time ASC, _id ASC
  remove(entries: ActivityLogEntry[]): Promise<void>;
}

type ArchiveOutput = { archivedRows: number; files: string[] };

class ArchiveActivityOverflow extends AbstractUseCase<void, ArchiveOutput, Deps> {
  static readonly DEFAULT_MAX_ROWS = 50_000;
  static readonly CHUNK_ROWS = 10_000;
  execute(): Promise<ArchiveOutput>
}
// Deps: { dataSource: ActivityLogDataSource; fileStorage: FileStorage; maxRows: number; enabled: boolean }
```

**Do:**
- Loop while `count - maxRows >= CHUNK_ROWS`: take the oldest chunk, store it, then delete it. Never archive a partial chunk.
- File: gzipped JSONL, one raw entry per line, in the tenant's `activitylog` storage type, named from the chunk's first and last `time` + first id so a retry overwrites the same file.
- `enabled` is false for Mongo tenants (factory reads `postgresCore`) → returns zeros; they keep the TTL.
- `maxRows` from `featureFlags.activityLog?.maxRows`, else the default.
- Verify first: `FileStorage.storeFile` takes a `BaseFile` — confirm one can be built for type `activitylog` and that disk and S3 land under `tenant.activityLogs`; if not, stop and ask.

**Test:** integration spec through the factory with a small `maxRows`/chunk override and `FakeFileStorage`-style storage: under cap → nothing; overflow below one chunk → nothing; two chunks → two files with the oldest rows, rows gone, newest kept; re-run after a simulated failed delete overwrites the same file; Mongo tenant → no-op — run `yarn test packages/activitylog/application/specs/ArchiveActivityOverflow.spec.ts app/api/tenants/specs/featureFlags.spec.ts`

---

## Step 10: Expose the archive run to operations

**Files:** apps/cli/activity/ActivityRoutes.ts, apps/cli/activity/routes/ArchiveActivityRoute.ts, apps/cli/activity/controllers/ArchiveActivityController.ts, apps/cli/activity/controllers/specs/ArchiveActivityController.spec.ts, apps/cli/activity/contracts.ts, packages/activitylog/composition.ts, apps/cli/docs/ (only if asked)

**Skeleton:**
```ts
class ActivityLogComposition {
  static archiveOverflowForCurrentTenant(): Promise<ArchiveOutput>
}

const ArchiveActivityOutputSchema = z.object({ archivedRows: z.number(), files: z.array(z.string()) });

class ArchiveActivityController { static handle(): Promise<ArchiveActivityOutput> }
```

**Do:**
- Follow the `apps/cli/segmentation` `QueueIdleSegmentations` route/controller precedent (a per-tenant command scheduled externally); the queue has no recurring-job primitive.
- Map the output field by field onto the CLI contract.

**Test:** controller spec as `ListActivityController.spec.ts` — run `yarn test apps/cli/activity`
