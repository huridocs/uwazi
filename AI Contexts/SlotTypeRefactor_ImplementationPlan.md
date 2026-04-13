# Slot Type Refactor — Implementation Plan

## Problem Summary

`SlotDocument.type` is currently `PropertyType` (e.g. `"text"`, `"multidate"`, `"relationship"`).
It should be `SlotType` (e.g. `"txt"`, `"date"`, `"relationship_txt"`), which is the actual
discriminant used for slot capacity buckets and elastic field name prefixes.

Three additional issues follow from this:

1. `MongoSlotsBootstrapper` converts `SlotType → PropertyType` unnecessarily when seeding DB docs.
2. `MongoSlotsDAO.assignSlot` receives a raw `PropertyType` and queries on it — the translation
   to `SlotType` is missing, and `inheritedType` is never considered.
3. `EntityElasticDocumentMapper` switches on `PropertyType` values from the slot; once `type`
   becomes `SlotType`, many fine-grained cases (e.g. `text` vs `link`) collapse into one (`txt`),
   and value-shape inspection is needed for disambiguation.

Two mapping classes (`SlotDefinition.SlotsMapper` and `SlotBootstrapDefinitions`) duplicate logic
that `SlotTypeRegistry` already owns. `SlotDefinition.ts` is never imported anywhere.

---

## Files Involved

| File                                        | Role                                                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `entities/SlotType.ts`                      | `SlotType` union — **no change needed**                                                                       |
| `entities/SlotDefinition.ts`                | Duplicate of Bootstrap + Registry — **delete**                                                                |
| `entities/SlotBootstrapDefinitions.ts`      | Bootstrap constants only — **strip `toPropertyType`, keep `slotList`, `AmountPerSlotType`, `createSlotName`** |
| `entities/SlotTypeRegistry.ts`              | `PropertyType → SlotType` lookup — **already correct, no change needed**                                      |
| `entities/MongoSlotsDAO.ts`                 | DAO — **change `type` field and `AssignSlotInput`**                                                           |
| `entities/MongoSlotsBootstrapper.ts`        | Seeds slots — **store `SlotType` directly**                                                                   |
| `entities/SlotsReconciler.ts`               | Orchestrates assign/unassign — **add `SlotTypeRegistry` call + skip unsupported**                             |
| `entities/EntityElasticDocumentMapper.ts`   | Maps entity → ES doc — **switch on `SlotType`, use value shape**                                              |
| `specs/MongoSlotsDAO.spec.ts`               | Unit tests — **update fixture `type` values + error messages**                                                |
| `specs/MongoSlotsBootstrapper.spec.ts`      | Integration tests — **update `expectedSlots` construction**                                                   |
| `specs/SlotsReconciler.spec.ts`             | Integration tests — **add test for unsupported `PropertyType`**                                               |
| `specs/EntityElasticDocumentMapper.spec.ts` | Unit tests — **update `createSlotMap` to use `SlotType`**                                                     |
| `specs/SlotBootstrapDefinitions.spec.ts`    | Unit tests — **remove `toPropertyType` tests**                                                                |

---

## Step-by-Step Plan

### Step 1 — Delete `SlotDefinition.ts`

`SlotDefinition.ts` (`SlotsMapper`) is a full duplicate of the two remaining mapping files and is
never imported. Delete it with no replacement.

**Files changed:** `SlotDefinition.ts` (deleted)

---

### Step 2 — Remove `toPropertyType` from `SlotBootstrapDefinitions`

`SlotBootstrapDefinitions.toPropertyType` was only used by `MongoSlotsBootstrapper` to convert
`SlotType` back to a `PropertyType` before storing. Once slots store `SlotType` directly (Step 3),
this conversion is no longer needed.

**Changes:**

- `SlotBootstrapDefinitions.ts`: remove the `slotTypePropertyTypeDictionary` map and `toPropertyType` static method.
- `specs/SlotBootstrapDefinitions.spec.ts`: remove all `toPropertyType()` test cases.

---

### Step 3 — Change `SlotDocument.type` from `PropertyType` to `SlotType`

The canonical type stored in the DB and used at runtime is `SlotType`. `PropertyType` is a
higher-cardinality input concept; `SlotType` is the storage/slot concept.

**Changes in `MongoSlotsDAO.ts`:**

- Remove `PropertyType` import.
- Add `SlotType` import from `./SlotType.js`.
- Change `SlotDocument.type: PropertyType` → `SlotDocument.type: SlotType`.
- Change `AssignSlotInput.type: PropertyType` → `AssignSlotInput`:
  ```ts
  type AssignSlotInput = {
    propertyName: string;
    propertyType: PropertyType;
    inheritedType?: PropertyType;
  };
  ```
- Inside `assignSlot`:
  - Import and call `SlotTypeRegistry.toSlotType(propertyType, inheritedType)`.
  - If the result is `undefined`, skip silently (unsupported type — no slot assigned).
  - Query `{ assignedTo: null, type: slotType }` (using the resolved `SlotType`).

**Changes in `specs/MongoSlotsDAO.spec.ts`:**

- All fixture documents that set `type: 'text'` → `type: 'txt'`, `type: 'image'` → omit or keep
  (becomes an unsupported type test), `type: 'date'` → stays `'date'`, etc.
- Update `assignSlot` call sites: `{ propertyName, type }` → `{ propertyName, propertyType }`.
- The "throws when no available slot for type" test for `image`: since `image` is unsupported,
  change semantics — `assignSlot` for an unsupported type should resolve without throwing (no-op).
  Add a new explicit test: unsupported type is silently skipped.
- Update error message assertion: `'No available slots for type text'` →
  `'No available slots for type txt'`.

---

### Step 4 — Update `MongoSlotsBootstrapper` to store `SlotType` directly

`createSlots` currently calls `SlotBootstrapDefinitions.toPropertyType(slotType)` to get the
`type` to store. After Step 2 removes that method, slots store the `SlotType` string directly.

**Changes in `MongoSlotsBootstrapper.ts`:**

```ts
// Before
type: SlotBootstrapDefinitions.toPropertyType(slotType),

// After
type: slotType,
```

Remove the now-unused `SlotBootstrapDefinitions` import if `toPropertyType` was the only method used
(keep if `slotList`, `AmountPerSlotType`, or `createSlotName` are still used — they are).

**Changes in `specs/MongoSlotsBootstrapper.spec.ts`:**

- `expectedSlots` is currently constructed via `SlotBootstrapDefinitions.toPropertyType(slotType)!`.
  Change to use `slotType` directly as the `type` value:
  ```ts
  const expectedSlots = SlotBootstrapDefinitions.slotList().flatMap(slotType =>
    Array.from({ length: AmountPerSlotType[slotType] }, (_, index) => ({
      type: slotType, // was: toPropertyType(slotType)!
      slotName: SlotBootstrapDefinitions.createSlotName(slotType, index + 1),
      assignedTo: null,
    }))
  );
  ```

---

### Step 5 — Update `SlotsReconciler` to pass `propertyType` + `inheritedType`

`SlotsReconciler` calls `assignSlot({ propertyName, type })` today. The new signature is
`{ propertyName, propertyType, inheritedType? }`. `MongoTemplatesDAO.getAllProperties()` currently
returns `{ name, type }` only — `inheritedType` is a field on `PropertySchema` but is not projected.

**Changes in `MongoTemplatesDAO.ts`:**

- `PropertyDescriptor` gains `inheritedType?: string` (or `PropertyType`).
- The aggregation `$project` adds `inheritedType: '$properties.inheritedType'`.

**Changes in `SlotsReconciler.ts`:**

- Pass `inheritedType` through to `assignSlot`:
  ```ts
  async ([propertyName, { type, inheritedType }]) =>
    assignedSlots.has(propertyName) ||
    this.deps.slotsDAO.assignSlot({ propertyName, propertyType: type, inheritedType });
  ```
- The `desired` map value changes from `PropertyType` to `{ type, inheritedType? }`.
- No explicit unsupported-type filtering here — `assignSlot` handles it silently (Step 3).

**Changes in `specs/SlotsReconciler.spec.ts`:**

- Add a test: a template with a property of unsupported type (e.g. `image`, `media`) does **not**
  get assigned a slot and does not throw.
- Existing tests remain structurally the same; fixture `type: 'text'` values in `slotsCollection()`
  direct inserts must change to `type: 'txt'`.

---

### Step 6 — Update `EntityElasticDocumentMapper` to switch on `SlotType`

The `buildSlottedMetadata` switch currently uses `PropertyType` cases. After this change,
`slot.type` is `SlotType`. Cases collapse as follows:

| Old `PropertyType` cases                | New `SlotType` case                         | Disambiguation needed?                                        |
| --------------------------------------- | ------------------------------------------- | ------------------------------------------------------------- |
| `'text'`, `'markdown'`, `'generatedid'` | `'txt'`                                     | No — all serialize as string                                  |
| `'link'`                                | `'txt'`                                     | **Yes** — value is `{ url, label }` object; use `toLinkValue` |
| `'date'`, `'multidate'`                 | `'date'`                                    | No                                                            |
| `'numeric'`                             | `'num'`                                     | No                                                            |
| `'daterange'`, `'multidaterange'`       | `'range'`                                   | No                                                            |
| `'select'`, `'multiselect'`             | `'select'`                                  | No                                                            |
| `'relationship'`                        | `'relationship'` and all `'relationship_*'` | Already handled via `slotName` prefix                         |
| `'geolocation'`                         | `'geolocation'`                             | No                                                            |

The `link` type collapses into `txt`. Since the mapper no longer knows _which_ `PropertyType`
produced the `txt` slot, it must inspect the value shape: if the value is a record with a `url` or
`label` key, apply `toLinkValue`; otherwise apply `toStringValue`. This is exactly what
`toLinkValue` already does — it already falls back to `toStringValue` for non-records. So the `txt`
case can safely use `toLinkValue` for all entries (a plain string value goes through the fallback
path and returns as-is via `String(value)`).

The `relationship` family already dispatches via `slotName` prefix inside `toRelationshipBySlot` /
`toInheritedRelationshipValue` — no change needed there.

**Changes in `EntityElasticDocumentMapper.ts`:**

- Remove `import { PropertyType }` (no longer needed).
- Rewrite the `switch (type)` block:
  ```ts
  switch (type) {
    case 'txt':
      slottedMetadata[slotName] = entries.map(entry => toLinkValue(entry.value));
      break;
    case 'date':
      slottedMetadata[slotName] = entries
        .map(entry => toNumberValue(entry.value))
        .filter((v): v is number => v !== null);
      break;
    case 'num':
      slottedMetadata[slotName] = entries
        .map(entry => toNumberValue(entry.value))
        .filter((v): v is number => v !== null);
      break;
    case 'range':
      slottedMetadata[slotName] = entries
        .map(entry => toDateRangeValue(entry.value))
        .filter((v): v is DateRange => v !== null);
      break;
    case 'select':
      slottedMetadata[slotName] = entries.map(toSelectValue);
      break;
    case 'relationship':
    case 'relationship_txt':
    case 'relationship_num':
    case 'relationship_date':
    case 'relationship_range':
    case 'relationship_select':
    case 'relationship_geolocation':
      slottedMetadata[slotName] = entries.map(entry => toRelationshipBySlot(slotName, entry));
      break;
    case 'geolocation':
      slottedMetadata[slotName] = entries
        .map(entry => toGeoPointValue(entry.value))
        .filter((v): v is GeoPointValue => v !== null);
      break;
    default:
      break;
  }
  ```
  Note: `date` and `num` have the same logic so they can share a case fall-through.

**Changes in `specs/EntityElasticDocumentMapper.spec.ts`:**

- `createSlotMap` helper currently types entries as `{ assignedTo, slotName, type: PropertyType }`.
  Change `type` to `SlotType`.
- Update all `createSlotMap` call site entries:
  - `type: 'text'` → `type: 'txt'`
  - `type: 'markdown'` → `type: 'txt'`
  - `type: 'generatedid'` → `type: 'txt'`
  - `type: 'link'` → `type: 'txt'`
  - `type: 'date'` → `type: 'date'` (unchanged)
  - `type: 'multidate'` → `type: 'date'`
  - `type: 'numeric'` → `type: 'num'`
  - `type: 'daterange'` → `type: 'range'`
  - `type: 'multidaterange'` → `type: 'range'`
  - `type: 'select'` → `type: 'select'` (unchanged)
  - `type: 'multiselect'` → `type: 'select'`
  - `type: 'relationship'` → depends on slot: `'relationship'` or `'relationship_txt'` etc.
    Currently those entries already use slotName (e.g. `relationship_txt_01`) but `type:
'relationship'`. They should become `type: 'relationship_txt'`, `type: 'relationship_num'`, etc.
    to match the new `SlotType`.
  - `type: 'geolocation'` → `type: 'geolocation'` (unchanged)
- The test assertion for `linkProp → txt_04` should still be `['https://example.org']`
  (unchanged behavior since `toLinkValue` handles both paths).

---

## Execution Order

1. Delete `SlotDefinition.ts`
2. Strip `toPropertyType` from `SlotBootstrapDefinitions` + update its spec
3. Change `SlotDocument.type` and `AssignSlotInput` in `MongoSlotsDAO` + update its spec
4. Update `MongoSlotsBootstrapper` + update its spec
5. Update `MongoTemplatesDAO` to project `inheritedType`
6. Update `SlotsReconciler` + update its spec
7. Update `EntityElasticDocumentMapper` + update its spec
8. Run type-check (`yarn check-types`) and tests
