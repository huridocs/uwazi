# Tenant Provisioning — Implementation Plan

## Context & Constraints

- Language: TypeScript (strict mode)
- Test framework: Jest
- Each component gets its own dedicated test file
- ES client: `@elastic/elasticsearch`
- `TenantRoutingRepository` real DB implementation is handled separately — this plan assumes a working implementation is injectable
- Steps are ordered by dependency depth — never implement a consumer before its dependency
- Every step must compile with `tsc --noEmit` and pass its tests before moving to the next

---

## Architecture Reference

```
CLI Scripts (entry points — two commands)
    │
    ├── create-index-group.ts  ──► TenantProvisioningService.createGroup()
    └── assign-tenant.ts       ──► TenantProvisioningService.assignTenant()
                                          │
                          ┌───────────────┼───────────────────┐
                          │               │                   │
                 IndexMappingRegistry  ES Client      TenantRoutingRepository
                 (borrow mappings)     (raw — not     (persist routing record)
                                        tenant-aware)
                                          │
                                   IndexNameResolver
                                   (invalidate cache
                                    after route written)
```

### Key Design Decisions Encoded in This Plan

- `createGroup` and `assignTenant` are two distinct operations — group creation and tenant assignment are never conflated
- The alias name is always derived from the group name, not the tenant ID
- Every operation is idempotent — safe to re-run after a failure at any step
- Delta sync (`updatedAt` range query) closes the write gap during reindex — same pattern as schema migration
- Cache invalidation is explicit and immediate — never wait for TTL after writing a routing record
- The provisioning service uses the raw ES `Client` directly, not `TenantAwareESClient` — graduation is a system-level operation that must read across tenant boundaries

---

## Routing Table Schema Reference

The `TenantRoutingRepository` implementation (handled separately) must support this record shape:

```typescript
interface TenantRouting {
  tenantId: string;
  logicalName: string; // e.g. 'products'
  resolvedAlias: string; // e.g. 'products_group_enterprise'
  groupName: string; // e.g. 'enterprise' — 'shared' by convention for default
  assignedAt: Date;
}
```

And these methods, in addition to `findRoute`:

```typescript
upsertRoute(record: Omit<TenantRouting, 'assignedAt'>): Promise<void>
findTenantsByGroup(groupName: string, logicalName: string): Promise<string[]>
deleteRoute(tenantId: string, logicalName: string): Promise<void>
```

These are contracts this plan depends on. If the repository implementation differs, adjust Step 2 accordingly.

---

## Step 1 — Extend Shared Types

**Goal:** Add provisioning-specific types to the existing `types.ts`. No logic — types only.

### File: `/app/api/core/infrastructure/elastic-search/types.ts` _(extend existing)_

Add the following interfaces:

**`IndexGroup`**

```typescript
interface IndexGroup {
  groupName: string;
  logicalName: string; // key in IndexMappingRegistry e.g. 'products'
  alias: string; // e.g. 'products_group_enterprise'
  physicalIndex: string; // e.g. 'products_group_enterprise_v1'
}
```

**`TenantAssignment`**

```typescript
interface TenantAssignment {
  tenantId: string;
  logicalName: string;
  groupName: string;
  resolvedAlias: string;
}
```

**`ProvisioningResult`** — returned by both provisioning operations for CLI output:

```typescript
interface ProvisioningResult {
  success: boolean;
  operation: 'create-group' | 'assign-tenant';
  details: Record<string, unknown>; // operation-specific metadata for logging
  durationMs: number;
}
```

**`GroupAlreadyExistsError`** — thrown when `createGroup` is called and alias already exists:

```typescript
class GroupAlreadyExistsError extends Error {
  constructor(groupName: string, alias: string);
}
```

**`TenantAlreadyInGroupError`** — thrown when `assignTenant` is called and tenant is already in the target group:

```typescript
class TenantAlreadyInGroupError extends Error {
  constructor(tenantId: string, groupName: string);
}
```

**`GroupNotFoundError`** — thrown when `assignTenant` references a group whose alias does not exist:

```typescript
class GroupNotFoundError extends Error {
  constructor(groupName: string, alias: string);
}
```

---

## Step 2 — IndexNameResolver: `invalidate()` Contract

**Goal:** Make `invalidate()` an explicit part of the `IndexNameResolver` interface — not just an implementation detail of `TenantIndexResolver`. The provisioning service depends on this contract, not the concrete class.

### File: `/app/api/core/infrastructure/elastic-search/index-name-resolver.ts` _(extend existing)_

Update the `IndexNameResolver` interface to include:

```typescript
export interface IndexNameResolver {
  resolve(logicalName: string, tenantId: string): Promise<string>;
  invalidate(tenantId: string, logicalName: string): void;
}
```

Verify `TenantIndexResolver` already satisfies this interface — it should from the original implementation. If `invalidate()` is missing, add it now.

**No behaviour change** — this step is purely about making the contract explicit so `TenantProvisioningService` can depend on the interface rather than the concrete class.

### File: `/app/api/core/infrastructure/elastic-search/specs/index-name-resolver.test.ts` _(extend existing)_

Add one test:

- After `assignTenant` writes a new route and calls `invalidate()`, the next `resolve()` call returns the new alias (not the previously cached value)

This test may be more naturally placed in the integration test (Step 6) — but the intent must be covered somewhere.

---

## Step 3 — GroupAliasNameBuilder

**Goal:** Centralise the convention for deriving alias and physical index names from a group name. This must never be scattered across the provisioning service, CLI scripts, and tests independently.

### File: `/app/api/core/infrastructure/elastic-search/group-alias-name-builder.ts`

Implement as a pure module (no class needed — stateless functions):

```typescript
export const GroupAliasNameBuilder = {
  /**
   * Derives the alias name for a named group.
   * e.g. ('enterprise', 'products') → 'products_group_enterprise'
   *      ('shared', 'products')     → 'products'  (shared = default alias)
   */
  toAlias(groupName: string, logicalName: string): string

  /**
   * Derives the initial physical index name for a new group.
   * e.g. ('enterprise', 'products') → 'products_group_enterprise_v1'
   */
  toPhysicalIndex(groupName: string, logicalName: string): string

  /**
   * Parses a group name from an alias.
   * e.g. ('products_group_enterprise', 'products') → 'enterprise'
   *      ('products', 'products') → 'shared'
   */
  fromAlias(alias: string, logicalName: string): string

  /**
   * Returns true if the group name refers to the shared default index.
   */
  isShared(groupName: string): boolean
}
```

The `'shared'` group name is the reserved sentinel for the default shared alias. `toAlias('shared', 'products')` returns `'products'` — the existing shared alias unchanged.

### File: `/app/api/core/infrastructure/elastic-search/specs/group-alias-name-builder.test.ts`

- `toAlias('enterprise', 'products')` → `'products_group_enterprise'`
- `toAlias('shared', 'products')` → `'products'` (shared = no suffix)
- `toAlias('high-volume', 'orders')` → `'orders_group_high-volume'`
- `toPhysicalIndex('enterprise', 'products')` → `'products_group_enterprise_v1'`
- `fromAlias('products_group_enterprise', 'products')` → `'enterprise'`
- `fromAlias('products', 'products')` → `'shared'`
- `isShared('shared')` → `true`
- `isShared('enterprise')` → `false`
- Round-trip: `fromAlias(toAlias(name, logical), logical) === name` for any valid name

---

## Step 4 — TenantProvisioningService

**Goal:** Core orchestration logic for group creation and tenant assignment. Idempotent. Uses raw ES client — not `TenantAwareESClient`. This is a system-level operation.

### File: `/app/api/core/infrastructure/elastic-search/tenant-provisioning-service.ts`

Constructor:

```typescript
constructor(
  private readonly esClient: Client,
  private readonly registry: Record<string, IndexDefinition>,
  private readonly routingRepository: TenantRoutingRepository,
  private readonly resolver: IndexNameResolver,
)
```

---

#### `createGroup(groupName: string, logicalName: string): Promise<ProvisioningResult>`

Steps (all idempotent):

1. Validate `logicalName` exists in registry — throw `Error` if not
2. Derive alias and physical index name via `GroupAliasNameBuilder`
3. Check if alias already exists via `esClient.indices.existsAlias()`
   - If exists: throw `GroupAlreadyExistsError`
4. Create physical index with mappings and settings from registry
5. Create alias pointing to physical index
6. Return `ProvisioningResult` with operation details

**No routing record is written here.** A group exists at the ES level — tenants are assigned separately.

---

#### `assignTenant(tenantId: string, logicalName: string, groupName: string): Promise<ProvisioningResult>`

Steps (all idempotent):

1. Validate `logicalName` exists in registry — throw if not
2. Derive target alias via `GroupAliasNameBuilder.toAlias(groupName, logicalName)`
3. Verify target alias exists in ES — throw `GroupNotFoundError` if not
4. Resolve current alias for this tenant via `resolver.resolve(logicalName, tenantId)`
5. If current resolved alias === target alias: throw `TenantAlreadyInGroupError`
6. Record `reindexStartedAt = new Date()`
7. Reindex — copy documents WHERE `tenantId = tenantId` from current alias → target alias:
   ```
   source: { index: currentAlias, query: { term: { tenantId } } }
   dest:   { index: targetAlias }
   ```
8. Delta sync — reindex again with `updatedAt >= reindexStartedAt` to catch writes during step 7
9. Upsert routing record: `routingRepository.upsertRoute({ tenantId, logicalName, resolvedAlias: targetAlias, groupName })`
10. Invalidate resolver cache: `resolver.invalidate(tenantId, logicalName)` — immediate, not TTL
11. Delete tenant's documents from source index (only if source !== target, i.e. not re-running):
    ```
    deleteByQuery WHERE tenantId = tenantId on currentAlias
    ```
12. Return `ProvisioningResult` with counts and timing

**Idempotency note:** If the service crashes between steps 9 and 11, re-running is safe — step 5 will throw `TenantAlreadyInGroupError` because the route is already written. The cleanup (step 11) must be handled as a separate recovery operation or manual step. Document this in JSDoc.

### File: `/app/api/core/infrastructure/elastic-search/specs/tenant-provisioning-service.test.ts`

Mock ES `Client`, `TenantRoutingRepository`, and `IndexNameResolver`.

**`createGroup`:**

- Throws on unknown `logicalName` in registry
- Throws `GroupAlreadyExistsError` when alias already exists
- Creates physical index with correct name from `GroupAliasNameBuilder`
- Uses mappings and settings from registry (not hardcoded)
- Creates alias pointing to physical index
- Does NOT write any routing record

**`assignTenant`:**

- Throws on unknown `logicalName`
- Throws `GroupNotFoundError` when target alias does not exist in ES
- Throws `TenantAlreadyInGroupError` when tenant is already on target alias
- Calls reindex with correct source (filtered by tenantId) and dest
- Calls delta sync reindex after first reindex completes
- Delta sync uses `updatedAt >= reindexStartedAt` range query
- Calls `routingRepository.upsertRoute` with correct record
- Calls `resolver.invalidate` with correct tenantId and logicalName
- `resolver.invalidate` is called AFTER `upsertRoute` — never before
- Calls `deleteByQuery` on source index for tenant's documents
- Does not call `deleteByQuery` if source and target are the same alias
- Returns `ProvisioningResult` with `success: true`
- ES error during reindex propagates — does not swallow

---

## Step 5 — CLI Scripts

**Goal:** Two standalone executable scripts. Each is a thin entry point — argument parsing, dependency wiring, delegating to `TenantProvisioningService`, structured output. No business logic here.

### File: `scripts/elastic-search/create-index-group.ts`

Arguments:

- `--group` (required) — group name e.g. `enterprise`
- `--index` (required) — logical index name e.g. `products`
- `--env` (optional, default: inferred from `NODE_ENV`) — for connection config

Flow:

1. Parse and validate arguments — exit with code 1 and usage message if missing
2. Wire dependencies: ES `Client`, `TenantRoutingRepository`, `TenantIndexResolver`, `TenantProvisioningService`
3. Call `provisioningService.createGroup(group, index)`
4. Print structured success output to stdout
5. On error: print error message to stderr, exit with code 1

Output format (stdout on success):

```
✓ Group created successfully
  Group:         enterprise
  Logical index: products
  Alias:         products_group_enterprise
  Physical:      products_group_enterprise_v1
  Duration:      1243ms
```

### File: `scripts/elastic-search/assign-tenant.ts`

Arguments:

- `--tenantId` (required)
- `--index` (required)
- `--group` (required)
- `--env` (optional)

Flow:

1. Parse and validate arguments
2. Wire dependencies
3. Print pre-flight summary and prompt for confirmation (unless `--yes` flag passed):
   ```
   About to assign tenant 'bigcorp' on index 'products' to group 'enterprise'
   This will reindex their documents and update routing. Continue? (y/N)
   ```
4. Call `provisioningService.assignTenant(tenantId, index, group)`
5. Print structured success output
6. On error: stderr + exit code 1

Output format (stdout on success):

```
✓ Tenant assigned successfully
  Tenant:        bigcorp
  Logical index: products
  Group:         enterprise
  Target alias:  products_group_enterprise
  Documents:     reindexed 4821, delta synced 3
  Duration:      8431ms
```

### File: `scripts/elastic-search/specs/create-index-group.test.ts`

These are unit tests on the script logic — not end-to-end. Mock `TenantProvisioningService`.

- Exits with code 1 when `--group` is missing
- Exits with code 1 when `--index` is missing
- Calls `createGroup` with correct arguments
- Prints success output to stdout on success
- Prints error to stderr and exits with code 1 on `GroupAlreadyExistsError`
- Prints error to stderr and exits with code 1 on unexpected errors

### File: `scripts/elastic-search/specs/assign-tenant.test.ts`

- Exits with code 1 when any required argument is missing
- Calls `assignTenant` with correct arguments
- Prints success output to stdout on success
- Skips confirmation prompt when `--yes` flag is passed
- Prints error to stderr and exits with code 1 on `GroupNotFoundError`
- Prints error to stderr and exits with code 1 on `TenantAlreadyInGroupError`
- Prints error to stderr and exits with code 1 on unexpected errors

---

## Step 6 — Integration Test

**Goal:** Wire all provisioning components together. No real ES connection — mock the raw `Client`. Verify the full flow including cache invalidation and routing resolution.

### File: `/app/api/core/infrastructure/elastic-search/specs/tenant-provisioning.integration.test.ts`

Wire the full graph:

```
InMemoryTenantRoutingRepository
    → TenantIndexResolver (IndexNameResolver)
    → TenantProvisioningService
    → GroupAliasNameBuilder (used internally)
```

**Scenario: create group then assign tenant**

- `createGroup('enterprise', 'products')` creates alias `products_group_enterprise`
- Before assignment: `resolver.resolve('products', 'bigcorp')` returns `'products'` (shared)
- `assignTenant('bigcorp', 'products', 'enterprise')` completes
- After assignment: `resolver.resolve('products', 'bigcorp')` returns `'products_group_enterprise'`
- Cache is immediately updated — does not require TTL expiry

**Scenario: two tenants assigned to same group**

- `assignTenant('bigcorp', 'products', 'enterprise')` succeeds
- `assignTenant('megacorp', 'products', 'enterprise')` succeeds
- Both resolve to `'products_group_enterprise'`
- Each tenant's documents are isolated — reindex query filters by `tenantId`

**Scenario: idempotency guards**

- `createGroup('enterprise', 'products')` called twice → second call throws `GroupAlreadyExistsError`
- `assignTenant('bigcorp', 'products', 'enterprise')` called twice → second call throws `TenantAlreadyInGroupError`

**Scenario: group not found**

- `assignTenant('bigcorp', 'products', 'nonexistent')` → throws `GroupNotFoundError`

**Scenario: shared group sentinel**

- `GroupAliasNameBuilder.toAlias('shared', 'products')` returns `'products'`
- A tenant on `'shared'` with no routing record resolves to `'products'` — consistent

---

---

## Implementation Order Rationale

```
1 → types (extended)                      no new deps
2 → index-name-resolver (extended)        interface contract for invalidate()
3 → group-alias-name-builder              no deps — pure functions
4 → tenant-provisioning-service           (2, 3, registry, routingRepository)
5 → CLI scripts                           (4)
6 → integration test                      (all)
```

---

## Key Invariants to Enforce in Every Step

1. Group creation never writes a routing record — only `assignTenant` does
2. `resolver.invalidate()` is always called after `routingRepository.upsertRoute()` — never before
3. The provisioning service uses raw ES `Client` — never `TenantAwareESClient`
4. `deleteByQuery` on the source index only runs after the routing record is committed
5. `GroupAliasNameBuilder` is the only place alias names are derived — never inline string concatenation elsewhere
6. `'shared'` is the only reserved group name — `isShared()` must be used for this check, never string comparison
7. Delta sync reindex always runs after the initial reindex — never skipped
8. All provisioning operations are idempotent — re-running after a partial failure must never corrupt state
