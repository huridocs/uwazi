# Plan: Tenant usage report (`uwazi usage report`) — issue #9782

Locked decisions:
- Name: **tenant usage**; three parts — **content**, **footprint**, **activity**. CLI: `usage report`, tenancy `single-or-all`.
- Lives in `packages/usage`, no `domain/` layer (read-only query, exception to "full DDD").
- Reads persistence directly (aggregates only, never maps to domain objects, never writes). Specs against both backends are the contract tests.
- Content follows tenant `postgresCore`; activity follows global `SESSIONS_BACKEND`; footprint is engine-level.
- `dbStorage` = Mongo `storageSize` + Postgres estimate (`sum(pg_column_size(row))` over every table with `tenant_id`); breakdown exposed.
- Last activity = latest session touch (24 h granularity accepted).
- File storage = sum of stored `size` metadata (no disk/S3 walk). All files counted (no soft-delete state exists).
- Output field names match uwazi-manager `Stats` so it maps 1:1.

---

## Step 1: Define the usage contract and the file-kind rule

**Files:** packages/usage/application/TenantUsage.ts, packages/usage/application/FileKind.ts, packages/usage/application/contracts/ContentUsageReader.ts, packages/usage/application/contracts/FootprintReader.ts, packages/usage/application/contracts/SearchIndexReader.ts, packages/usage/application/contracts/ActivityReader.ts, packages/usage/application/specs/FileKind.spec.ts

**Skeleton:**
```ts
type FileTypeCounts = { document: number; attachment: number; custom: number; thumbnail: number };
type FileKindName = 'pdf' | 'image' | 'video' | 'audio' | 'office' | 'text' | 'other' | 'unknown';
type KindUsage = { count: number; size: number };

type TenantUsage = {
  entitiesCount: number;
  filesCount: FileTypeCounts;
  filesByBucket: Record<FileKindName, KindUsage>;
  filesStorage: number;
  dbStorage: number;
  dbStorageByEngine: { mongo: number; postgres: number };
  elasticStorage: number;
  lastSession: number | null; // epoch ms
};

class FileKind {
  static readonly ALL: readonly FileKindName[];
  static of(mimetype: string | null | undefined): FileKindName;
  static empty(): Record<FileKindName, KindUsage>;
  static bucket(groups: { mimetype: string | null; count: number; size: number }[]): Record<FileKindName, KindUsage>;
}

type ContentUsage = Pick<TenantUsage, 'entitiesCount' | 'filesCount' | 'filesByBucket' | 'filesStorage'>;
interface ContentUsageReader { read(): Promise<ContentUsage> }
interface FootprintReader { databaseBytes(): Promise<number> }   // one per engine
interface SearchIndexReader { indexBytes(indexName: string): Promise<number> }
interface ActivityReader { lastSession(tenantName: string): Promise<number | null> }
```

**Do:**
- Port `classifyMimetype` rules verbatim from uwazi-manager `core/domain/constants/FileBuckets.ts` (same 8 keys, same office mimetype set).
- Contracts in `packages/usage/application/contracts`, one interface per file.

**Test:** `FileKind.spec.ts` — every bucket, null/blank → `unknown`, case/whitespace normalised, `bucket()` merges several mimetypes into one kind — `yarn test packages/usage/application`

---

## Step 2: Content readers (Mongo + Postgres)

**Files:** packages/usage/infrastructure/mongodb/MongoContentUsageReader.ts, packages/usage/infrastructure/postgresql/PostgresContentUsageReader.ts, packages/usage/application/specs/ContentUsageReader.spec.ts

**Skeleton:**
```ts
class MongoContentUsageReader implements ContentUsageReader {
  constructor(db: Db)                       // getConnection() — tenant DB
  read(): Promise<ContentUsage>
}
class PostgresContentUsageReader implements ContentUsageReader {
  constructor(deps: { tenantId: string; pgTransactionManager: PostgresTransactionManager })
  read(): Promise<ContentUsage>
}
```

**Do:**
- Entities: count distinct `sharedId` (Mongo `$group`+`$count`; PG `count(DISTINCT "sharedId")`).
- Files: group by `type` → `FileTypeCounts` (missing types = 0); group by `mimetype` with count + `sum(size)` → `FileKind.bucket`; `filesStorage` = sum of `size` (null → 0).
- PG: always filter `tenant_id = $1` and run through `ExecutionContext.postgresTransactionManager` so RLS on `entities` applies.

**Test:** one shared spec run against both readers with identical fixtures (entities in 2 languages, files of every type, mixed mimetypes, a file with no size); asserts identical `ContentUsage`. Include a second tenant's rows in PG to prove isolation — `yarn test packages/usage/application/specs/ContentUsageReader.spec.ts`

---

## Step 3: Footprint readers (Mongo, Postgres, Elasticsearch)

**Files:** packages/usage/infrastructure/mongodb/MongoFootprintReader.ts, packages/usage/infrastructure/postgresql/PostgresFootprintReader.ts, packages/usage/infrastructure/elasticsearch/ElasticSearchIndexReader.ts, packages/usage/application/specs/FootprintReader.spec.ts

**Skeleton:**
```ts
class MongoFootprintReader implements FootprintReader {
  constructor(db: Db)
  databaseBytes(): Promise<number>          // db.stats().storageSize
}
class PostgresFootprintReader implements FootprintReader {
  constructor(deps: { tenantId: string; pgTransactionManager: PostgresTransactionManager })
  databaseBytes(): Promise<number>
  private tenantTables(): Promise<string[]> // information_schema.columns WHERE column_name = 'tenant_id'
}
class ElasticSearchIndexReader implements SearchIndexReader {
  constructor(client: Client)                // elasticClient from #api/search/elastic.js
  indexBytes(indexName: string): Promise<number>   // cat.indices bytes:'b', h:'store.size'; missing index → 0
}
```

**Do:**
- PG estimate: `sum(pg_column_size(t.*))` per discovered table filtered by `tenant_id`; table names quoted via identifier escaping, not string concat of user input.
- Mongo footprint is always read (postgresCore tenants still have a Mongo DB); PG footprint only when `postgresCore`, else 0.

**Test:** Mongo > 0 after inserting fixtures; PG grows when a tenant's rows are added and is unaffected by another tenant's rows; ES returns > 0 for a created test index and 0 for a missing one — `yarn test packages/usage/application/specs/FootprintReader.spec.ts`

---

## Step 4: Activity readers (Mongo + Postgres sessions)

**Files:** packages/usage/infrastructure/sessions/MongoActivityReader.ts, packages/usage/infrastructure/sessions/PostgresActivityReader.ts, app/api/auth/httpSessionStore.ts, packages/usage/application/specs/ActivityReader.spec.ts

**Skeleton:**
```ts
class MongoActivityReader implements ActivityReader {
  constructor(sharedDb: Db)                 // getSharedConnection(), collection 'sessions'
  lastSession(tenantName: string): Promise<number | null>   // max(lastModified) where session ~ "///<tenant>"
}
class PostgresActivityReader implements ActivityReader {
  constructor(pool: Pool)                   // PostgresDB.pool(); http_sessions has no tenant_id / RLS
  lastSession(tenantName: string): Promise<number | null>   // max(expire) - TTL where sess->'passport'->>'user' LIKE '%///<tenant>'
}
```

**Do:**
- Export `TTL_SECONDS` from `app/api/auth/httpSessionStore.ts` (no behaviour change) and reuse it.
- Escape `%`/`_` in tenant name for LIKE; anchor the regex in Mongo.
- Sessions without `passport.user` ignored; none → `null`.

**Test:** both readers with sessions for two tenants + an anonymous one; returns the latest for the asked tenant only, `null` when none — `yarn test packages/usage/application/specs/ActivityReader.spec.ts`

---

## Step 5: Compose the report and wire the package

**Files:** packages/usage/application/ReportTenantUsage.ts, packages/usage/infrastructure/factories/ReportTenantUsageFactory.ts, packages/usage/composition.ts, packages/usage/index.ts, packages/usage/application/specs/ReportTenantUsage.spec.ts

**Skeleton:**
```ts
class ReportTenantUsage {
  constructor(deps: {
    content: ContentUsageReader;
    footprint: { mongo: FootprintReader; postgres: FootprintReader | null };
    searchIndex: SearchIndexReader;
    activity: ActivityReader;
  })
  execute(tenant: { name: string; indexName: string }): Promise<TenantUsage>
}
class ReportTenantUsageFactory { static default(): ReportTenantUsage }   // reads ExecutionContext.currentTenant, config.sessionsBackend
class UsageComposition { static reportForCurrentTenant(): Promise<TenantUsage> }
```

**Do:**
- Factory picks content/PG-footprint by `tenant.featureFlags?.postgresCore`, activity by `config` sessions backend (follow `UsersQueryServiceFactory` shape).
- `dbStorage = mongo + postgres`, both in `dbStorageByEngine`.
- `index.ts` exports `TenantUsage` type only.

**Test:** unit spec with in-memory fakes for each port — composes fields, sums engines, passes `indexName` and tenant name through — `yarn test packages/usage/application/specs/ReportTenantUsage.spec.ts`

---

## Step 6: CLI `usage report` command

**Files:** apps/cli/runtime/CliConnections.ts, apps/cli/runtime/CliConfig.ts, apps/cli/routing/Route.ts (needs shape), every existing route's `needs`, apps/cli/usage/contracts.ts, apps/cli/usage/routes/UsageReportRoute.ts, apps/cli/usage/controllers/UsageReportController.ts, apps/cli/usage/UsageRoutes.ts, apps/cli/routing/RouteRegistry.ts, apps/cli/usage/controllers/specs/UsageReportController.spec.ts, apps/cli/runtime/specs (CliConfig spec)

**Skeleton:**
```ts
type ConnectionNeeds = { redis: boolean; elasticsearch: boolean };
class UsageReportRoute implements Route<NoInput, TenantUsage> {
  readonly group = 'usage'; readonly name = 'report'; readonly tenancy = 'single-or-all';
  readonly needs = { redis: false, elasticsearch: true };
}
class UsageReportController { static async handle(): Promise<TenantUsage> }
```

**Do:**
- `CliConfig.requiredFor`: when `needs.elasticsearch` in production require `ELASTICSEARCH_URL` and `SESSIONS_BACKEND` (wrong default would silently read the wrong store).
- Add `elasticsearch: false` to every existing route.
- Register `UsageRoutes.all()` in `RouteRegistry`.
- Pretty output via existing `Presenter` (key: value).

**Test:** controller spec via `apps/cli/testing/ControllerSpecs.ts` for `--tenant` and `--all-tenants` (one Mongo tenant, one postgresCore tenant); `CliConfig` spec for the new required vars; extend `CliApplication.spec`/smoke if routes are enumerated — `yarn test apps/cli`

---

## Step 7: Document the command

**Files:** apps/cli/docs/usage.md, apps/cli/README.md

**Do:**
- `usage.md`: purpose, tenancy, output example, field meanings, how each part is sourced (flag vs `SESSIONS_BACKEND`), PG estimate caveat, 24 h activity granularity, error codes.
- README: add module row; add `ELASTICSEARCH_URL`, `ELASTICSEARCH_API_KEY`, `SESSIONS_BACKEND` to Configuration.
- (Asked for: these are CLI docs, not `docs/`.)

**Test:** none, docs-only — run `yarn prettier --check apps/cli`

---

## Step 8: Verify and hand off to manager / operations

**Files:** none in this repo

**Do:**
- Run `yarn check-types`, `yarn lint --type-aware packages/usage apps/cli app/api/auth/httpSessionStore.ts`, `yarn prettier --check` on touched paths.
- Manual: `yarn uwazi usage report --all-tenants --pretty` locally with one postgresCore tenant.
- Draft follow-up notes (not code here):
  - **operations:** add `ELASTICSEARCH_URL`, `ELASTICSEARCH_API_KEY`, `SESSIONS_BACKEND`, `TENANTS_BACKEND` to `roles/uwazi_service/templates/uwazi-cli.env.j2` and `playbooks/uwazi_cli.yml` `_cli_environment`.
  - **manager:** add `usage` to `UwaziCliGroup`, `report` to `isUwaziCliReadCommand`; replace `MongoUwaziGateway` stats methods, `ElasticSearchGateway` and session scan in `TenantsStatsService`/`UpdateTenantsStats` with one `usage report --all-tenants` call; manager keeps `filesCount = document + attachment`, `totalStorage`, `lastUpdated`, `max(lastSession)`; drop `classifyMimetype`.

**Test:** the commands above green; manual CLI output matches the manager's current numbers for a Mongo tenant
