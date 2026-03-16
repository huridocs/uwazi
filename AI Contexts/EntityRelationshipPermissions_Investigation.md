# Entity Relationship Permissions Investigation

**Last Updated:** 2026-03-05  
**Status:** Investigation Complete - Ready for Fix Planning

## Investigation Summary

This investigation examined how the `GET /api/entities` endpoint handles permissions for relationship data, focusing on potential security gaps that could leak restricted entity information to unauthorized users.

### Key Findings

1. **Issue #1: Dead Code in Route-Level Relationship Filter**

   - The route handler attempts to filter unpublished entities from `entity.relationships`, but the actual field is `entity.relations`
   - Protection exists accidentally through query-level filtering, not explicit route-level filtering
   - System is fragile and test gives false positive

2. **Issue #2: Metadata Relationship Properties Leak Restricted Entity Data**
   - Both v1 (`relationship`) and v2 (`newRelationship`) metadata properties use unrestricted queries during denormalization
   - No filtering at read time when returning entity metadata
   - Unauthenticated users can see titles, icons, and inherited metadata from unpublished entities through relationship properties

---

## Current Status

### Completed Work

1. ✅ Traced full `GET /api/entities` endpoint implementation and relationship fetching pipeline
2. ✅ Documented permission system architecture (`ModelWithPermissions`, `entitiesPermissions`, etc.)
3. ✅ Identified dead code bug in route-level relationship filtering (Issue #1)
4. ✅ Discovered metadata relationship property permission leak (Issue #2) in both v1 and v2 systems
5. ✅ Traced v1 and v2 denormalization systems to confirm both use unrestricted queries
6. ✅ Analyzed all frontend call sites to understand actual usage patterns
7. ✅ Created comprehensive tracking document

### Next Steps (When User is Ready)

- Decide on filtering approach for metadata relationship properties (read-time vs write-time)
- Plan fix for Issue #1 (correct field name + pass unpublished flag + update test)
- Plan fix for Issue #2 (implement read-time filtering for v1 relationship properties first)

---

## Issue #1: Dead Code in Route-Level Relationship Filter

### Location

`app/api/entities/routes.js` lines 196-240, specifically line 232

### The Problem

```javascript
// Line 232 - attempts to filter entity.relationships
if (!(await needsAuthorization(req)) && !req.query.unpublished) {
  processedRows = processedRows.map(row => {
    const entity = { ...row };
    if (entity.relationships) {  // ❌ WRONG FIELD NAME
      entity.relationships = entity.relationships.filter(
        (r: any) => r.entity.published || r.entity.sharedId === req.query.sharedId
      );
    }
    return entity;
  });
}
```

**Bug:** The code checks `entity.relationships`, but the actual field populated by `getWithRelationships()` is `entity.relations`.

### Why It Still Works (Accidentally)

The system is protected by a different mechanism:

1. `getWithRelationships()` calls `relationships.getByDocument(sharedId, req.language, false)`
2. The third parameter `unrestricted=false` causes `withConnectedData()` to call `entities.get()` with permission context
3. `entities.get()` uses `ModelWithPermissions.get()` which applies `appendPermissionQuery()`
4. For anonymous users, this adds `{ published: true }` to the query
5. Unpublished entities never enter the result set

### The Fragility

- If `unrestricted` were changed to `true`, the leak would happen with no visible guard
- The route-level filter looks like it's doing something but it's dead code
- Test in `deprecatedRoutes.spec.js` (lines 262-319) gives false positive by mocking wrong field name

### Related Code

- `app/api/entities/entities.js:483-498` - `getWithRelationships()`
- `app/api/relationships/relationships.js:87-126` - `getByDocument()`
- `app/api/relationships/relationshipsHelpers.js:161-163` - `removeUnpublished()` (unused here)

---

## Issue #2: Metadata Relationship Properties Leak Restricted Entity Data

### The Problem

Entity metadata can contain `relationship` (v1) and `newRelationship` (v2) type properties. Each relationship value is denormalized at write time with structure:

```typescript
{
  value: "target_shared_id",
  label: "Target Entity Title",  // ⚠️ Leaked for unpublished entities
  icon: { _id: "...", type: "..." },  // ⚠️ Leaked
  inheritedValue: [...],  // ⚠️ Arbitrary metadata from target
  inheritedType: "text"
}
```

**Security Gap:** When an authenticated user views a published entity A that has a relationship to unpublished entity B, the denormalized metadata in A's `metadata` field reveals:

- B's title (in `label`)
- B's icon (in `icon`)
- B's metadata values (in `inheritedValue`)

This happens because:

1. **Write-time denormalization uses unrestricted queries** (both v1 and v2)
2. **Read-time returns metadata verbatim** with no filtering

### V1 System (relationship properties)

**Denormalization Entry Point:**

- `app/api/entities/denormalize.ts` - `denormalizeMetadata()` (called on entity save)

**The Leak:**

```typescript
// Line 326-364 in denormalize.ts
const denormalizeRelationshipProperty = async (
  relationshipValues: MetadataValue[],
  property: PropertySchema,
  entity: EntitySchema
) => {
  // ...
  const model = instanceModel<EntitySchema>('entities');
  const query = { sharedId: { $in: relatedEntityIds } };

  // ❌ Uses unrestricted query - fetches unpublished entities
  const relatedEntities = await model.getUnrestricted(query, '+permissions');

  // Populates label, icon, inheritedValue from ALL entities
  // ...
};
```

**Back-propagation:**

- `denormalizeRelated()` (lines 177-227) updates relationship metadata when target entity changes
- Uses `model.updateMany()` with MongoDB array filters
- No permission filtering when selecting which entities to update

### V2 System (newRelationship properties)

**Denormalization Entry Point:**

- `app/api/entities.v2/services/EntityRelationshipsUpdateService.ts`
- `app/api/relationships.v2/services/DenormalizationService.ts`

**The Leak:**

```typescript
// EntityRelationshipsUpdateService uses raw MongoDB aggregation
// via MongoEntitiesDataSource and MongoRelationshipsDataSource
// No ODM layer = no permission filtering
```

**Process:**

1. Relationship changes mark metadata as "obsolete"
2. `EntityRelationshipsUpdateService.update()` rebuilds via aggregation pipeline
3. Uses `MongoEntitiesDataSource` which bypasses ODM permission layer
4. Denormalizes all relationship values without checking target publish status

### Read-Time Gap

**Endpoint:** `GET /api/entities` (lines 196-240 in `app/api/entities/routes.js`)

```javascript
// Returns entities with metadata verbatim from MongoDB
const { rows: processedRows } = await entities.getWithRelationships(query, req.user, req.language);
// No filtering of metadata.relationship_property[].label or inheritedValue
```

**What Gets Exposed:**

- Any user who can view entity A can see denormalized data from all related entities (B, C, D...) in A's metadata, regardless of B/C/D's publish status or permissions

### Frontend Impact

**Only surfaces to end users through one call site:**

- `app/react/V2/Routes/Entity/loader.ts` - entity detail page explicitly requests relationship data with `omitRelationships: false`

**All other call sites:**

- Use `omitRelationships: true` (default) which skips `entity.relations` but still includes full `entity.metadata`
- Still vulnerable to metadata leak (Issue #2) even though they don't request relations

---

## How Denormalization Works

### V1 System (`app/api/entities/denormalize.ts`)

**On Entity Save:**

1. `denormalizeMetadata()` called from `entities.save()`
2. For each `relationship` property: `denormalizeRelationshipProperty()`
3. Fetches target entities with `model.getUnrestricted()`
4. Populates `label`, `icon`, `inheritedValue`, `inheritedType` from targets
5. Returns enriched metadata object

**On Target Entity Change:**

1. `denormalizeRelated()` called when entity with ID is updated
2. Finds all entities that have relationship properties pointing to this entity
3. Uses `model.updateMany()` with MongoDB `arrayFilters` to update denormalized values in-place
4. No permission check when selecting which entities to update

### V2 System

**Entry Points:**

- `app/api/entities.v2/services/EntityRelationshipsUpdateService.ts`
- `app/api/relationships.v2/services/DenormalizationService.ts`

**Process:**

1. Relationship create/delete/entity save triggers denormalization service
2. Marks affected metadata as "obsolete" via `MarkRelationshipPropertiesAsObsoleteService`
3. `EntityRelationshipsUpdateService.update()` rebuilds relationship metadata
4. Uses raw MongoDB aggregation via `MongoEntitiesDataSource.getAll()` and `MongoRelationshipsDataSource.getAllByEntityIds()`
5. No ODM layer = no `ModelWithPermissions` = no permission filtering

**Triggered By:**

- Entity save (if has newRelationship properties)
- Relationship create/delete
- Template changes affecting relationship properties

---

## Frontend Usage Patterns

### Key Finding

**Every call site passes `sharedId` or `_id`** - the endpoint is exclusively used as "fetch one entity by ID", consistent with server-side `{ limit: 1 }` hard-code.

### Main API Wrappers

**Legacy (`app/react/Entities/EntitiesAPI.js`):**

```javascript
// Lines 10-18
get: (requestParams: RequestParams) =>
  api.get('entities', new RequestParams({ ...requestParams, include: ['permissions'] }))
```

- Always injects `include: ['permissions']`
- Used by older components

**V2 Typed (`app/react/V2/api/entities/index.ts`):**

```typescript
// Lines 14-66
export const getById = async (
  id: string,
  language?: string,
  omitRelationships: boolean = true // Default hides relations
): Promise<ClientEntity> => {
  /* ... */
};

export const getBySharedId = async (
  sharedId: string,
  language?: string,
  omitRelationships: boolean = true // Default hides relations
): Promise<ClientEntity> => {
  /* ... */
};
```

### Call Sites Requesting Relationship Data

**Only One:**

- `app/react/V2/Routes/Entity/loader.ts` - entity detail page explicitly sets `omitRelationships: false`

### Call Sites Using Default (omitRelationships: true)

**Primary:**

- `app/react/Viewer/EntityView.jsx` - SSR state loader for entity detail page
- `app/react/Library/actions/libraryActions.js` - entity selection in library
- `app/react/Relationships/actions/actions.js` - reload after relationship save
- Many entity form/viewer components

**Impact:**

- Issue #1 (dead relationship filter) only visible on entity detail page
- Issue #2 (metadata leak) affects ALL call sites since `entity.metadata` always included

---

## Permission System Architecture

### Core Components

**`ModelWithPermissions` (`app/api/odm/ModelWithPermissions.ts`):**

- Extends base ODM model with permission enforcement
- `get()` - applies `appendPermissionQuery()` to filter by published status and user access
- `save()` - validates user has write permission
- `delete()` - validates user has delete permission
- Only entities use this model - pages, files, templates, etc. use basic `instanceModel`

**`permissionsContext` (`app/api/permissions/permissionsContext.ts`):**

- Uses Node's `AsyncLocalStorage` to thread current user through all layers
- `getUserInContext()` - retrieves current request user
- `needsPermissionCheck()` - determines if filtering required
- `permissionsRefIds()` - gets entity IDs user has access to

**`entitiesPermissions` (`app/api/permissions/entitiesPermissions.ts`):**

- Permission management service
- `set()` - assigns permissions to entities
- `get()` - retrieves permissions for entities
- Used by `POST/PUT /api/entities/permissions` endpoints

### Query-Level Filtering

**`appendPermissionQuery()` logic:**

```typescript
// For unauthenticated users
{ published: true }

// For authenticated users without specific permissions
{
  $or: [
    { published: true },
    { sharedId: { $in: [user's accessible entity IDs] } }
  ]
}
```

### Connections Collection

**No Permission Model:**

- `app/api/relationships/model.js` uses plain `instanceModel` (no permissions)
- Connections (relationship hubs) have no access control
- Security only applies when enriching connections with entity data via `withConnectedData()`

---

## Test Coverage

### Existing Tests

**`app/api/entities/specs/entities.spec.js`:**

- Lines 1007-1026: Integration tests for `getWithRelationships()`
- Tests basic functionality but not permission edge cases

**`app/api/entities/specs/routes.spec.ts`:**

- Lines 56-68: Tests relationship permissions
- Validates authorized users can access relationships

**`app/api/entities/specs/deprecatedRoutes.spec.js`:**

- Lines 262-319: **Misleading test for Issue #1**
- Mocks `entity.relationships` (wrong field name)
- Gives false positive that route-level filter works

### Coverage Gaps

**Missing Tests:**

1. Unauthenticated user viewing entity A with relationships to unpublished entity B
   - Should NOT see B's title/icon in A's metadata relationship properties
2. Authenticated user without permission to entity B viewing A
   - Should NOT see B's denormalized data in A's metadata
3. Route-level relationship filter with correct field name (`entity.relations`)
4. Inherited metadata values from restricted entities

---

## Recommended Fix Strategy

### Approach: Read-Time Filtering

**Why Read-Time:**

- Write-time denormalization needs unrestricted data to maintain referential integrity
- Filtering at read time is cleaner separation of concerns
- Easier to audit and test

### Implementation Plan

**Phase 1: Fix Issue #1 (Low-Hanging Fruit)**

1. Fix field name in route handler: `entity.relationships` → `entity.relations`
2. Ensure `req.query.unpublished` flag passed correctly
3. Update test in `deprecatedRoutes.spec.js` to mock correct field
4. Add integration test for anonymous user viewing entity with unpublished relations

**Phase 2: Fix Issue #2 - V1 Properties**

1. Create filtering utility: `filterRelationshipMetadata(entity, user)`
2. For each `relationship` property in metadata:
   - Check if target entity (by `value` sharedId) is accessible to user
   - If not: remove entire value object from array (don't just redact fields)
3. Apply filter in `entities.getWithRelationships()` before returning
4. Add tests for unauthenticated and unauthorized users

**Phase 3: Fix Issue #2 - V2 Properties**

1. Extend filtering utility to handle `newRelationship` properties
2. Same logic: check accessibility, strip inaccessible entries
3. Add comprehensive test coverage

**Phase 4: Audit & Documentation**

1. Search for other denormalized fields that might leak data
2. Document permission filtering requirements for future denormalization
3. Add architectural decision record (ADR) if applicable

### Alternative: Write-Time Filtering (NOT RECOMMENDED)

**Why Not:**

- Requires maintaining multiple denormalized versions per permission level
- Complex cache invalidation when permissions change
- Storage overhead
- Harder to reason about correctness

---

## Related Files

### Backend - Routes & Controllers

- `app/api/entities/routes.js` - GET /api/entities route handler (lines 196-240)
- `app/api/relationships/routes.js` - GET /api/references for comparison

### Backend - Entity Business Logic

- `app/api/entities/entities.js` - `get()`, `getWithRelationships()` (483-498)
- `app/api/entities/entitiesModel.ts` - entity model using `instanceModelWithPermissions`

### Backend - Denormalization Systems

- `app/api/entities/denormalize.ts` - v1: `denormalizeMetadata()`, `denormalizeRelationshipProperty()` (326-364), `denormalizeRelated()` (177-227)
- `app/api/entities.v2/services/EntityRelationshipsUpdateService.ts` - v2 rebuild
- `app/api/relationships.v2/services/DenormalizationService.ts` - v2 orchestration
- `app/api/entities.v2/database/MongoEntitiesDataSource.ts` - raw MongoDB queries

### Backend - Relationships

- `app/api/relationships/relationships.js` - `getByDocument()` (87-126)
- `app/api/relationships/relationshipsHelpers.js` - `processRelationshipCollection()`, `removeUnpublished()` (161-163)
- `app/api/relationships/model.js` - connections collection (plain `instanceModel`)

### Backend - Permission System

- `app/api/odm/ModelWithPermissions.ts` - core enforcement: `get()`, `appendPermissionQuery()`
- `app/api/permissions/permissionsContext.ts` - `getUserInContext()`, `needsPermissionCheck()`
- `app/api/permissions/entitiesPermissions.ts` - permission management: `set()`, `get()`
- `app/api/permissions/routes.ts` - POST/PUT /api/entities/permissions

### Backend - Types & Schema

- `app/shared/types/commonTypes.d.ts` - `MetadataObjectSchema`, `PropertySchema`, `InheritedValueSchema`
- `app/shared/types/permissionSchema.ts` - `AccessLevels`, `PermissionType`
- `app/shared/types/permissionType.d.ts` - `PermissionSchema` interface
- `app/shared/propertyTypes.ts` - property type constants

### Frontend - API Clients

- `app/react/Entities/EntitiesAPI.js` - legacy wrapper (lines 10-18)
- `app/react/V2/api/entities/index.ts` - V2 typed wrappers (lines 14-66)

### Frontend - Call Sites

- `app/react/V2/Routes/Entity/loader.ts` - only site requesting relationship data
- `app/react/Viewer/EntityView.jsx` - SSR state loader
- `app/react/Library/actions/libraryActions.js` - entity selection
- `app/react/Relationships/actions/actions.js` - reload after save

### Tests

- `app/api/entities/specs/entities.spec.js` - integration tests (1007-1026)
- `app/api/entities/specs/routes.spec.ts` - route tests (56-68)
- `app/api/entities/specs/deprecatedRoutes.spec.js` - misleading test (262-319)

---

## Notes

- Investigation focused on understanding, not implementing fixes
- V1 relationship system should be fixed before V2
- Read-time filtering preferred over write-time
- Strip full entries for inaccessible entities (don't just redact fields)
- Inherited metadata values make Issue #2 more severe (arbitrary data leak)
