# Multi-Tenant Elasticsearch — Implementation Plan

## Context & Constraints

- Language: TypeScript (strict mode)
- Test framework: Jest
- Each component gets its own dedicated test file
- ES client: `@elastic/elasticsearch`
- Shared index + tenant field (keyword) strategy
- Hybrid routing: default shared alias, DB overrides for graduated tenants
- Every component must compile and tests must pass before moving to the next step

---

## Architecture Reference

```
HTTP / Queue / Job Entry Points
    │
    └── TenantContext.run()         ← ambient context, set once per entry point
            │
            ▼
    TenantAwareESClient             ← single chokepoint for all ES operations
        │           │
        │     IndexNameResolver     ← resolves logical alias → physical alias
        │         │       │
        │     (cache)  TenantRoutingRepository  ← DB override lookups
        │
        ├── stamp tenantId on every write
        └── AND tenant filter on every query

    IndexMappingRegistry            ← source of truth for mappings/settings
        │           │
    Bootstrapper  MigrationManager  ← operational components

    Domain-specific:
        ProductIndexer              ← event-driven, per-document write path
        ProductSearchService        ← query translation, receives resolved AuthorizationContext
        BulkIndexer                 ← batch/backfill path

    Application Layer:
        Query Handlers              ← orchestrate: resolve auth, then delegate to search service
```

---

## Step 1 — Project Setup & Shared Types

**Goal:** Establish the TypeScript project structure, install dependencies, and define all shared types that downstream components depend on.

### Tasks

1. Create `src/app/api/core/infrastructure/elastic-search/types.ts` with all shared interfaces.

### File: `src/app/api/core/infrastructure/elastic-search/types.ts`

Define the following interfaces — these are pure types, no logic:

- `TenantContextData` — `{ tenantId: string; userId: string }`
- `AuthorizationContext` — `{ isAdmin: boolean; allowedResourceIds?: string[]; allowedAttributes?: Record<string, string[]> }`
- `ExecutionContext` — extends `TenantContextData`, adds `authorization: AuthorizationContext`
- `IndexDefinition` — `{ alias: string; physicalPrefix: string; settings: Record<string, unknown>; mappings: MappingTypeMapping }`
- `SearchOptions` — alias, query, from, size, sort, source
- `IndexOptions` — alias, id, document
- `DeleteOptions` — alias, id
- `BulkOperation` — id, document
- `BulkOptions` — alias, operations array
- `TenantRoutingRecord` — `{ tenantId: string; logicalName: string; resolvedAlias: string }`

---

## Step 2 — TenantContext

**Goal:** Implement ambient tenant context using `AsyncLocalStorage`. This is the first enforcement gate — it must throw hard when not set.

### File: `src/app/api/core/infrastructure/tenant-context.ts`

Implement `TenantContext` as a module-level object (not a class) with:

- `run<T>(data: TenantContextData, fn: () => Promise<T>): Promise<T>` — establishes context for an async chain
- `get(): TenantContextData` — throws `TenantContextMissingError` if not set
- `getTenantId(): string`
- `getUserId(): string`
- `isSet(): boolean`

Implement `TenantContextMissingError`:

- Extends `Error`
- Clear message explaining which entry points must call `run()`
- Sets `this.name`

### File: `src/app/api/core/infrastructure/tenant-context.test.ts`

Cover the following cases:

- `get()` throws `TenantContextMissingError` when no context has been set
- `get()` returns correct data inside a `run()` block
- Context does not leak between two independent `run()` calls
- Nested `run()` calls use the innermost context
- `isSet()` returns false outside `run()`, true inside
- Context is correctly propagated through `await` chains within the same `run()` block
- `getTenantId()` and `getUserId()` return correct values

---

## Step 3 — IndexMappingRegistry

**Goal:** Define the canonical source of truth for all managed ES indexes. This feeds both `IndexBootstrapper` and `IndexMigrationManager`.

### File: `src/app/api/core/infrastructure/elastic-search/index-mapping-registry.ts`

Define `IndexMappingRegistry` as a plain const object (not a class) keyed by logical name.

Include the `products` index definition with:

- `alias: 'products'`
- `physicalPrefix: 'products'`
- Standard settings: shards, replicas, custom `text_analyzer` (standard tokenizer + lowercase + asciifolding)
- Mappings for 4 fields:
  - `tenantId` — keyword
  - `id` — keyword
  - `name` — text (with `text_analyzer`) + keyword sub-field
  - `description` — text (with `text_analyzer`)
  - `price` — scaled_float (scaling_factor: 100)

Use `satisfies IndexDefinition` on each entry to enforce shape at compile time.

### File: `src/app/api/core/infrastructure/elastic-search/index-mapping-registry.test.ts`

- `products` entry exists and has all required fields
- `alias` and `physicalPrefix` are non-empty strings
- `mappings.properties` contains all 5 expected fields (`tenantId`, `id`, `name`, `description`, `price`)
- `tenantId` field is of type `keyword`
- `price` field has `scaling_factor: 100`
- Settings contain `analysis.analyzer.text_analyzer`

---

## Step 4 — TenantRoutingRepository

**Goal:** Define the interface and a concrete implementation for DB-backed routing override lookups. This is the only component allowed to touch a database in the ES infrastructure layer.

### File: `src/app/api/core/infrastructure/elastic-search/tenant-routing-repository.ts`

Define the interface:

```typescript
export interface TenantRoutingRepository {
  findRoute(tenantId: string, logicalName: string): Promise<string | null>;
}
```

Implement `InMemoryTenantRoutingRepository` backed by a `Map` — used in tests and local development:

```typescript
export class InMemoryTenantRoutingRepository implements TenantRoutingRepository {
  constructor(private readonly routes: Map<string, string> = new Map()) {}
  // key format: `${tenantId}:${logicalName}`
}
```

Provide a stub for a real DB implementation (`DbTenantRoutingRepository`) — constructor accepts a db client, method is not implemented (throws `NotImplementedError`). This exists to make the dependency explicit in the DI graph.

### File: `src/app/api/core/infrastructure/elastic-search/tenant-routing-repository.test.ts`

Test `InMemoryTenantRoutingRepository`:

- Returns `null` when no route exists for a tenant+logical pair
- Returns the correct alias when a route exists
- Route for tenant A does not interfere with tenant B
- Route for `products` does not interfere with route for `orders` for the same tenant

---

## Step 5 — IndexNameResolver

**Goal:** Implement the hybrid routing resolver. Default path (shared alias) must never hit the DB. Only graduated tenants trigger a DB lookup.

### File: `src/app/api/core/infrastructure/elastic-search/index-name-resolver.ts`

Define the interface:

```typescript
export interface IndexNameResolver {
  resolve(logicalName: string, tenantId: string): Promise<string>;
}
```

Implement `TenantIndexResolver` (the hybrid implementation):

- Constructor: `(repository: TenantRoutingRepository, cacheTTLms?: number)`
- Default `cacheTTLms`: 60_000
- Cache key: `${tenantId}:${logicalName}`
- On cache miss: call `repository.findRoute()`
- If repository returns `null`: return `logicalName` as-is (shared alias = logical name)
- If repository returns a string: return that (dedicated alias)
- Cache the result for `cacheTTLms` using `setTimeout` for eviction
- Expose `invalidate(tenantId: string, logicalName: string): void` for explicit cache busting

### File: `src/app/api/core/infrastructure/elastic-search/index-name-resolver.test.ts`

- Returns logical name unchanged when no DB route exists (default shared path)
- Returns DB override when route exists
- Caches result — second call does not hit repository again
- Cache expires after TTL (use fake timers: `jest.useFakeTimers()`)
- After expiry, next call hits repository again
- `invalidate()` causes next call to hit repository
- Two different tenants with routes do not share cached values
- Repository error propagates as thrown exception (no silent fallback)

---

## Step 6 — TenantAwareESClient

**Goal:** The single chokepoint for all ES operations. Enforces tenantId on every write and every query. Uses `IndexNameResolver` for routing. This is the most critical component — tests must be exhaustive.

### File: `src/app/api/core/infrastructure/elastic-search/tenant-aware-es-client.ts`

Constructor: `(client: Client, resolver: IndexNameResolver, tenantId: string)`

- `tenantId` is baked in at construction time — immutable, never read from ambient context
- The instance is scoped to exactly one tenant for its entire lifetime
- Throw `InvalidTenantIdError` in the constructor if `tenantId` is empty or blank

Implement the following methods:

- `search<T>(options: SearchOptions): Promise<SearchResponse<T>>`
- `index(options: IndexOptions): Promise<void>`
- `delete(options: DeleteOptions): Promise<void>`
- `bulk(options: BulkOptions): Promise<void>` — throws `BulkIndexingError` on partial failures

**Private: `applyTenantGuard(query)`**

Uses `this.tenantId`. This is the security-critical method. Rules:

- tenant filter always goes in the `filter` clause (never `must`, never `should`)
- If caller passed a `bool` query: inject into its existing `filter` array (merge, do not replace)
- If caller passed any other query shape: wrap in `bool.must`, add tenant to `bool.filter`
- Result: tenant filter can never be ORed away regardless of what the caller constructs

**Private: `buildDocumentId(id)`**

Uses `this.tenantId`. Format: `${this.tenantId}__${id}`. Applied to all write operations (index, delete, bulk). Prevents cross-tenant ID collisions in shared index.

**Private: `stampTenantId(document)`**

Always overwrites `tenantId` field with `this.tenantId` — never trusts a value that may be present in the caller-supplied document.

### Factory: `TenantAwareESClientFactory`

The raw `Client` and `IndexNameResolver` are singletons. `TenantAwareESClient` is request-scoped. A factory bridges the two:

```typescript
export class TenantAwareESClientFactory {
  constructor(
    private readonly client: Client,
    private readonly resolver: IndexNameResolver
  ) {}

  forTenant(tenantId: string): TenantAwareESClient {
    return new TenantAwareESClient(this.client, this.resolver, tenantId);
  }
}
```

The factory is registered as a singleton in the DI container. Entry points (HTTP middleware, queue consumers) call `factory.forTenant(tenantId)` and inject the scoped instance into the downstream graph for that request.

### File: `src/app/api/core/infrastructure/elastic-search/tenant-aware-es-client.test.ts`

Mock the raw ES `Client` and `IndexNameResolver`. Instantiate with an explicit `tenantId` — no `TenantContext` setup required in any test.

**Constructor:**

- Throws `InvalidTenantIdError` when constructed with an empty string
- Throws `InvalidTenantIdError` when constructed with a whitespace-only string
- Does not throw when constructed with a valid tenantId

**`applyTenantGuard`:**

- Plain `match_all` query → wrapped in `bool.must`, tenant in `bool.filter`
- `bool` query with no filter → tenant added to `bool.filter`
- `bool` query with existing filter array → tenant appended, existing filters preserved
- `bool` query with single filter object (not array) → normalised to array, tenant appended
- `bool` query with `should` clauses → tenant goes in `filter`, not inside `should`
- Caller cannot override tenantId by including it in their own query

**`buildDocumentId`:**

- Format is `tenantId__id`
- Two instances with different tenantIds produce different document IDs for the same logical id

**`stampTenantId`:**

- A document passed with a different `tenantId` value has it overwritten with `this.tenantId`

**`index`:**

- Calls resolver with logical alias and constructor-bound tenantId
- Uses resolved alias in ES call
- Document is stamped with constructor-bound tenantId

**`bulk`:**

- Throws `BulkIndexingError` when response contains errors
- Does not throw when all operations succeed
- All documents in bulk are stamped with constructor-bound tenantId

**`TenantAwareESClientFactory`:**

- `forTenant()` returns a new instance on each call
- Each returned instance carries the correct tenantId
- Factory reuses the same underlying `Client` and `resolver` across instances

---

## Step 7 — Entry Point Bootstraps

**Goal:** Provide reusable utilities for establishing `TenantContext` at every type of entry point.

### File: `src/app/api/core/infrastructure/elastic-search/entry-points.ts`

Implement three utilities:

**`tenantContextMiddleware(extractTenantId, extractUserId)`**

- Returns Express/Fastify-compatible middleware function
- Calls `TenantContext.run()` and then `next()`
- Throws if `extractTenantId` returns empty string

**`withMessageContext<T>(message, handler)`**

- `message` must have `tenantId: string`, optional `userId?: string`, and `payload: T`
- Bootstraps `TenantContext.run()` and calls handler with payload
- `userId` defaults to `'system'` if not provided
- Throws `InvalidMessageContextError` if `tenantId` is empty

**`withSystemContext<T>(fn)`**

- For cross-tenant system-level operations (full reindex, migration)
- Does NOT set `TenantContext` — explicitly a no-tenant operation
- Accepts a raw ES `Client` directly, bypassing `TenantAwareESClient`
- Documents in JSDoc that this must never be used in request-path code

### File: `src/app/api/core/infrastructure/elastic-search/entry-points.test.ts`

- Middleware sets `TenantContext` correctly for the request chain
- `withMessageContext` sets tenantId from message payload
- `withMessageContext` defaults userId to 'system'
- `withMessageContext` throws on empty tenantId
- Context established in one `withMessageContext` call is not visible in another concurrent call

---

## Step 8 — IndexBootstrapper

**Goal:** One-time environment setup. Creates physical indexes and aliases from the registry. Idempotent — safe to run multiple times.

### File: `src/app/api/core/infrastructure/elastic-search/index-bootstrapper.ts`

Constructor: `(client: Client, registry: Record<string, IndexDefinition>)`

Methods:

- `bootstrapAll(): Promise<void>` — iterates registry, calls `bootstrapOne` for each
- `bootstrapOne(name: string, definition: IndexDefinition): Promise<void>`
  - Checks if alias already exists via `client.indices.existsAlias()`
  - If exists: logs and skips (idempotent)
  - If not: creates physical index `${physicalPrefix}_v1` with settings, mappings, and alias in a single `client.indices.create()` call

### File: `src/app/api/core/infrastructure/elastic-search/index-bootstrapper.test.ts`

Mock the ES `Client`.

- Skips creation when alias already exists
- Creates physical index with `_v1` suffix when alias does not exist
- Alias is created pointing to the physical index in the same call (not a separate alias operation)
- `bootstrapAll()` calls `bootstrapOne` for each entry in the registry
- Logs a skip message when index already exists (spy on `console.log`)
- Does not throw on a registry with zero entries

---

## Step 9 — IndexMigrationManager

**Goal:** Zero-downtime migrations via atomic alias swaps. Reads from registry for new mappings. Supports rollback.

### File: `src/app/api/core/infrastructure/elastic-search/index-migration-manager.ts`

Constructor: `(client: Client, registry: Record<string, IndexDefinition>)`

**`migrate(options: MigrationOptions): Promise<void>`**

Options:

- `indexName: string` — key in registry
- `targetVersion: number`
- `waitForCompletion?: boolean` (default: true)
- `validate?: (client: Client, newPhysicalIndex: string) => Promise<boolean>` — pre-cutover hook

Steps:

1. Resolve current physical index from alias (throw if alias points to multiple indexes)
2. No-op if already on target version
3. Create new physical index with registry mappings (not yet aliased)
4. Call ES Reindex API
5. Run validation hook if provided — on failure: delete new index, throw `MigrationValidationError`
6. Atomic alias swap: single `updateAliases` call removes old, adds new
7. Log that old index is retained (do not delete automatically)

**`rollback(indexName: string, toVersion: number): Promise<void>`**

- Resolves target physical index name
- Checks it exists — throws descriptively if not (was it deleted post-migration?)
- Atomic alias swap back

**Private: `resolvePhysicalIndex(alias: string): Promise<string>`**

- Throws if alias not found
- Throws with explicit message if alias points to multiple indexes (ambiguous write target)

### File: `src/app/api/core/infrastructure/elastic-search/index-migration-manager.test.ts`

Mock the ES `Client`.

- Throws on unknown index name (not in registry)
- No-ops when already on target version
- Creates new physical index with correct name format `${prefix}_v${N}`
- Calls reindex API with correct source and dest
- Runs validation hook before alias swap
- Aborts and deletes new index if validation returns false
- Throws `MigrationValidationError` on validation failure
- Performs atomic swap in a single `updateAliases` call
- Rollback swaps alias back to specified version
- Rollback throws if target physical index does not exist
- `resolvePhysicalIndex` throws if alias points to multiple indexes

---

## Step 10 — BulkIndexer

**Goal:** Batch indexing path for backfills, resyncs, and operational reindexing from primary DB. Must be distinctly separate from the event-driven per-document path.

### File: `src/app/api/core/infrastructure/elastic-search/bulk-indexer.ts`

Constructor: `(client: Client)`

**`run<TSource>(options: BulkIndexerRunOptions<TSource>): Promise<void>`**

Options:

- `alias: string`
- `tenantId: string`
- `fetchPage: (page: number, pageSize: number) => Promise<TSource[]>`
- `transform: (item: TSource) => { id: string; document: Record<string, unknown> }`
- `pageSize?: number` (default: 500)
- `onProgress?: (page: number, pageCount: number, totalSoFar: number) => void`

Behaviour:

- Bootstraps its own `TenantContext.run()` with `userId: 'system'` — does not rely on ambient context
- Loops: fetch page → transform → bulk index → increment → repeat until page returns fewer items than `pageSize`
- Uses `TenantAwareESClient` internally (so tenant stamping and ID prefixing still apply)
- Calls `onProgress` after each page
- Logs page and total count after each batch

### File: `src/app/api/core/infrastructure/elastic-search/bulk-indexer.test.ts`

- Processes all pages until empty page is returned
- Stops when a page returns fewer items than `pageSize`
- Calls `onProgress` with correct page, pageCount, and running total
- Sets `TenantContext` correctly for the run (verify tenantId is stamped on documents)
- Does not require ambient `TenantContext` to be set before calling `run()`
- Handles empty first page (no bulk calls made)
- Transform function is called for every item

---

## Key Invariants to Enforce in Every Step

These must never be violated — if a test does not cover them, add one:

1. `tenantId` is always written by `TenantAwareESClient`, never trusted from call sites
2. The tenant filter is always in the `filter` clause — never `must`, never `should`
3. Document IDs are always prefixed: `${tenantId}__${id}`
4. `tenantId` is never returned in read models — stripped before leaving `ProductSearchService`
5. Search services never call the DB — only the query handler resolves auth
6. `TenantContext` missing → hard throw, not a null/undefined silent path
7. `IndexNameResolver` miss → returns logical name unchanged (shared alias), never throws
8. `TenantAwareESClient` never reads `TenantContext` — tenantId comes exclusively from constructor
