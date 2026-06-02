# Slot Provisioning: Implementation Plan

## Overview

Wire slot provisioning to the templates data source so that whenever a template is created, updated, or deleted, the `elasticSlots` collection is reconciled to reflect the exact set of unique property names currently in use across all templates — atomically, within the same MongoDB transaction.

### Core invariant

> A slot must be assigned to property name `P` for as long as at least one template has a property named `P`. It must be released exactly when no template uses `P`.

### Approach: stateless reconciliation on every template write

After writing a template, re-read the full templates collection (within the same transaction session) and compute the desired slot state from scratch. Diff against the current slots collection and apply only the necessary `assignSlot` / `unassignSlot` calls. No reference counting. No diff tracking across requests. The reconciler is a pure function of the current DB state.

### Correctness under concurrency

Two concurrent transactions that each remove the last reference to a property name would both observe (via stale snapshot) that the other template still exists, and each would leave the slot assigned — a ghost slot. To force a conflict and trigger a retry, every reconciliation bumps a sentinel document in `elasticSlots`. MongoDB's `WriteConflict` (error code 112) aborts one transaction; the retry reads a clean snapshot and computes the correct state.

---

## Step 1 — Make `assignSlot` idempotent

**Problem:** `assignSlot` currently throws `"Property already assigned"` when a slot is already assigned to `propertyName`. Under reconciliation this is a valid no-op: reconcile may call `assignSlot("description", "text")` even if the slot is already correctly assigned.

**Change:** `MongoSlotsDAO.assignSlot`

Transform the duplicate-key guard into a silent no-op. If `assignedTo = propertyName` already exists (unique index violation → code 11000), simply return without error or cache invalidation.

Remove `UpdatePropertyNameInput` type and `updatePropertyName()` method — reconciliation makes them unnecessary.

**Tests** (`MongoSlotsDAO.spec.ts`) — add/update:

```
assignSlot()
  ✓ assigns an available slot for the requested property type           [existing]
  ✓ is a no-op when the property is already assigned to a slot         [NEW]
  ✓ throws NoAvailableSlotsError when no free slot exists for type      [existing]
  ✓ throws NoAvailableSlotsError when type has no slots at all          [existing]

updatePropertyName() — remove all tests
```

**Files touched:**

- `app/api/core/infrastructure/elasticSearch/entities/MongoSlotsDAO.ts`
- `app/api/core/infrastructure/elasticSearch/specs/MongoSlotsDAO.spec.ts`

---

## Step 2 — Add a sentinel document and `touchSentinel()` to `MongoSlotsDAO`

**Purpose:** Force a `WriteConflict` whenever two concurrent reconciliations touch the same collection, so MongoDB aborts one and the use-case layer can retry.

**Sentinel document shape** (lives in `elasticSlots` collection alongside slot documents):

```ts
{ _id: 'reconcile_sentinel', version: number }
```

Created by `MongoSlotsBootstrapper` alongside the slot rows. Never has `assignedTo` so it is invisible to all existing slot queries (which filter on `assignedTo`).

**New method on `MongoSlotsDAO`:**

```ts
async touchSentinel(): Promise<void>
// $inc { version: 1 } on the sentinel document, within the transaction session.
// Two concurrent transactions both calling this will produce a WriteConflict on commit.
```

**Tests** (`MongoSlotsDAO.spec.ts`) — new describe block:

```
touchSentinel()
  ✓ increments the sentinel version
  ✓ creates the sentinel if it does not exist (upsert)
```

**`MongoSlotsBootstrapper`** — add `createSentinel()`:

```ts
async createSentinel(): Promise<void>
// upsert { _id: 'reconcile_sentinel', version: 0 } with $setOnInsert
```

Call it from `execute()` after `createSlots()`.

**Tests** (`MongoSlotsBootstrapper.spec.ts`) — add:

```
✓ creates the sentinel document on bootstrap
✓ does not overwrite an existing sentinel
```

**Files touched:**

- `app/api/core/infrastructure/elasticSearch/entities/MongoSlotsDAO.ts`
- `app/api/core/infrastructure/elasticSearch/entities/MongoSlotsBootstrapper.ts`
- `app/api/core/infrastructure/elasticSearch/specs/MongoSlotsDAO.spec.ts`
- `app/api/core/infrastructure/elasticSearch/specs/MongoSlotsBootstrapper.spec.ts`

---

## Step 3 — Introduce `MongoTemplatesDAO`

A new pure infrastructure component that talks directly to the `templates` collection and returns raw DBOs. No domain objects, no mapping, no business logic — mirrors the pattern of `MongoEntityDAO`.

```ts
class MongoTemplatesDAO extends MongoDataSource<TemplateDBO> {
  protected collectionName = 'templates';

  constructor(db: Db, transactionManager: MongoTransactionManager) {
    super(db, transactionManager);
  }

  async getAllProperties(): Promise<Array<{ name: string; type: string }>> {
    // aggregation: unwind properties across all templates, project name + type
    // uses the active transaction session so it sees the caller's own writes
  }
}
```

`getAllProperties()` flattens `properties` across every template document into a flat list of `{ name, type }` pairs. It excludes `commonProperties` (not mapped to slots). Because it runs through `getCollection()`, which uses the transaction session, it reads the state after the triggering write.

**Tests** (`MongoTemplatesDAO.spec.ts` — new file, integration against real MongoDB):

```
getAllProperties()
  ✓ returns all properties from all templates as flat { name, type } pairs
  ✓ excludes commonProperties
  ✓ returns an empty array when no templates exist
  ✓ returns properties from multiple templates in a single flat list
  ✓ reads through the active transaction session (sees own uncommitted writes)
```

**Files touched:**

- `app/api/core/infrastructure/mongodb/template/MongoTemplatesDAO.ts` ← new
- `app/api/core/infrastructure/mongodb/template/specs/MongoTemplatesDAO.spec.ts` ← new

---

## Step 4 — Implement `SlotsReconciler`

A self-contained infrastructure class. It owns the full reconcile cycle: reads current template properties via `MongoTemplatesDAO`, diffs against current slots, and applies changes via `MongoSlotsDAO`. `MongoTemplatesDataSource` has no involvement beyond calling `execute()`.

```ts
type Deps = {
  slotsDAO: MongoSlotsDAO;
  templatesDAO: MongoTemplatesDAO;
};

class SlotsReconciler {
  constructor(private deps: Deps) {}

  async execute(): Promise<void>;
}
```

**Algorithm:**

```
desired  = unique { name, type } from templatesDAO.getAllProperties() (deduped by name)
current  = Map<name, SlotDocument> from slotsDAO.getAssignedSlots()

toAssign  = desired names not in current  →  slotsDAO.assignSlot(name, type)  for each
toRelease = current names not in desired  →  slotsDAO.unassignSlot(name)      for each

slotsDAO.touchSentinel()   ← always, even when nothing changes
slotsDAO.invalidateCache() ← always
```

`assignSlot` and `unassignSlot` calls are sequential to preserve transaction session semantics.

**Tests** (`SlotsReconciler.spec.ts` — new file, unit tests with mocked DAO and templatesDAO):

```
execute()
  ✓ assigns slots for properties returned by templatesDAO
  ✓ releases slots for names no longer returned by templatesDAO
  ✓ is a no-op for unchanged properties (sentinel still touched)
  ✓ handles a rename: releases old name, assigns new name
  ✓ deduplicates: same property name across multiple templates → assigned exactly once
  ✓ always touches the sentinel, even when nothing changes
  ✓ invalidates the slot cache after every execution
```

**Files touched:**

- `app/api/core/infrastructure/elasticSearch/entities/SlotsReconciler.ts` ← new
- `app/api/core/infrastructure/elasticSearch/specs/SlotsReconciler.spec.ts` ← new

---

## Step 5 — Wire `SlotsReconciler` into `MongoTemplatesDataSource`

`MongoTemplatesDataSource` takes a `SlotsReconciler` as a new optional constructor parameter. After every template write (`create`, `update`, `delete`, `bulkUpdate`), it calls `slotsReconciler.execute()` — nothing else. The reconciler owns all the logic of what to read and what to change.

```ts
constructor(
  db: Db,
  transactionManager: MongoTransactionManager,
  options?: MongoDSOptions,
  slotsReconciler?: SlotsReconciler   // ← new, optional for backwards compat
)
```

The call site in each mutating method:

```ts
async create(template: Template): Promise<void> {
  const schema = MongoTemplateMapper.toSchema(template);
  await this.getCollection().insertOne(schema);
  this.templatesMutated.set(schema._id, schema);
  await this.slotsReconciler?.execute();
}
```

Same pattern for `update`, `delete`, `bulkUpdate`. No template data is prepared or passed — `SlotsReconciler` reads what it needs through `MongoTemplatesDAO`, which shares the same transaction session.

**Why `delete` too:** After deletion the template is gone from the session's view. `MongoTemplatesDAO.getAllProperties()` will no longer include its properties, so the reconciler releases the now-orphaned slots correctly.

**Tests** (`MongoTemplatesDataSource.spec.ts` — new describe block, integration test against real MongoDB):

```
slot reconciliation (wired via SlotsReconciler)
  ✓ assigns slots for all properties when a template is created
  ✓ assigns new slot when a property is added via update
  ✓ releases slot when a property is removed via update (sole user)
  ✓ does not release slot when another template still uses the same property name
  ✓ releases slot when the template is deleted and it was the sole user
  ✓ does not release slot on delete when another template still uses the property name
  ✓ handles rename: releases old slot, acquires new
  ✓ is a no-op when no slot changes are needed (sentinel still bumped)
  ✓ two properties with same name across templates share one slot
  ✓ bulkUpdate reconciles correctly
```

These tests wire a real `SlotsReconciler(MongoTemplatesDAO, MongoSlotsDAO)` with bootstrapped slot rows (`MongoSlotsBootstrapper.createSlots()` + `createIndexes()` + `createSentinel()` in `beforeAll`).

**Files touched:**

- `app/api/core/infrastructure/mongodb/template/MongoTemplatesDataSource.ts`
- `app/api/core/infrastructure/mongodb/template/specs/MongoTemplatesDataSource.spec.ts`

---

## Step 6 — Retry on `WriteConflict` in the transaction manager

The use-case layer calls `transactionManager.run(fn)`. When a `WriteConflict` occurs (error code 112), the transaction is automatically aborted by MongoDB. The runner must retry the entire callback transparently.

**Change:** wherever transactions are started (likely `MongoTransactionManager.run()`), wrap the execution in a retry loop:

```ts
const MAX_RETRIES = 3;
let attempt = 0;
while (true) {
  try {
    return await session.withTransaction(fn);
  } catch (err) {
    if (isWriteConflict(err) && attempt < MAX_RETRIES) {
      attempt++;
      continue;
    }
    throw err;
  }
}

function isWriteConflict(err: unknown): boolean {
  return err instanceof MongoError && err.code === 112;
}
```

**Tests** (`MongoTransactionManager.spec.ts` — new cases):

```
✓ retries on WriteConflict and succeeds on second attempt
✓ re-throws after MAX_RETRIES consecutive WriteConflicts
✓ does not retry on other error codes
```

**Files touched:**

- `app/api/core/infrastructure/mongodb/common/MongoTransactionManager.ts`
- Corresponding spec file

---

## Step 7 — Wire into the factory / composition root

Wherever `MongoTemplatesDataSource` is instantiated (factories, DI wiring, integration test helpers), build and pass a `SlotsReconciler` constructed from a `MongoTemplatesDAO` and a `MongoSlotsDAO`, all sharing the same `db` and `transactionManager`.

Search for: `new MongoTemplatesDataSource(` and `MongoTemplatesDataSource` in factory files.

**No new files — only factory wiring updates.**

**Tests:** the integration tests from Step 4 already cover this end-to-end. Verify existing factory-level tests still pass.

---

## Step 8 — Remove `updatePropertyName` from `MongoSlotsDAO`

Now that reconciliation handles renames as release + acquire, `updatePropertyName` is dead code. Remove it, its type, and all its tests.

Also remove `MongoSlotsDataSource` if it was a separate parallel implementation of the same thing — verify if it's still referenced anywhere.

**Files touched:**

- `app/api/core/infrastructure/elasticSearch/entities/MongoSlotsDAO.ts`
- `app/api/core/infrastructure/elasticSearch/specs/MongoSlotsDAO.spec.ts`
- Any file that imported `updatePropertyName`

---

## Dependency order

```
Step 1  (idempotent assignSlot)
  ↓
Step 2  (sentinel + bootstrapper)
  ↓
Step 3  (MongoTemplatesDAO — new DBO-level DAO)
  ↓
Step 4  (SlotsReconciler — depends on Step 1 + 2 + 3)
  ↓
Step 5  (wire into MongoTemplatesDataSource — depends on Step 4)
  ↓
Step 6  (retry on WriteConflict — depends on Step 5 being wired)
  ↓
Step 7  (factory wiring — depends on Step 5 + 6)
  ↓
Step 8  (remove dead code — safe after Step 7)
```

Each step has self-contained tests and leaves the system in a valid, passing state.

---

## What does NOT change

- `SlotBootstrapDefinitions`, `SlotType`, `AmountPerSlotType` — untouched
- `EntityIndexerService`, `EntityElasticDocumentMapper` — untouched; they continue using `getSlotMap()` as before
- Common properties (`title`, `creationDate`, `editDate`) — not mapped to slots; excluded from `desiredProperties` in `reconcileSlots()`
- `MongoSlotsDAO.getSlotMap()` and cache — unchanged; reconciler only uses `getAssignedSlots()` (not the cache) to avoid stale reads inside the transaction
