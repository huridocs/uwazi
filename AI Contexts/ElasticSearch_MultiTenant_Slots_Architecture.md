# Elasticsearch Multi-Tenant Architecture with Slots

## Overview

This architecture implements a **tenant-aware, property-slot-mapped Elasticsearch system** designed to handle multi-tenancy while maintaining bounded index field limits. The core innovation is **property-to-slot mapping**: instead of creating one ES field per property (unbounded growth), properties are mapped to fixed **slots**, enabling efficient multi-tenant indexing.

---

## 1. Critical Importance of Slots Management

### Why Slots Exist

**Problem**: Elasticsearch has field limits (`index.mapping.total_fields.limit=4500` in this setup).

- Without slots: Each template property → 1 ES field
- With 100+ properties across templates and multiple tenants → Field explosion
- Multi-tenancy compounds this: `metadata.property_X` repeated per tenant

**Solution**: Property-to-slot mapping

- Properties are **named in MongoDB** (e.g., `title`, `description`, `priority`)
- Properties are **mapped to numbered slots** in Elasticsearch (e.g., `slot_1`, `slot_2`, `slot_3`)
- Slots are **pre-allocated and fixed** (e.g., 50 slots per property type)
- Result: Bounded ES field count, unlimited properties via reuse

### Core Tradeoff

| Aspect                  | Without Slots             | With Slots                      |
| ----------------------- | ------------------------- | ------------------------------- |
| ES fields per property  | 1 field = 1 property name | 1 slot = N properties over time |
| Field count scalability | O(properties × tenants)   | O(slots) [fixed]                |
| Query complexity        | Direct field match        | Slot lookup before query        |
| Performance impact      | None                      | Minimal (in-memory slot map)    |

---

## 2. Architecture Components

### 2.1 ElasticSearchClientFactory

**File**: `ElasticSearchClientFactory.ts`

Factory pattern for creating ES clients with two modes:

```
ElasticSearchClientFactory
├── getInstance()
│   └── Singleton ES Client (shared, stateless)
│
├── tenantAware(tenantId)
│   └── TenantAwareESClient
│       ├── applies tenant filter to all queries
│       └── uses IndexNameResolver to find tenant's index
│
└── authorizedEntityClient(tenantId, actor)
    └── AuthorizedEntityESClient
        ├── adds permission filtering on top
        └── returns only entities actor can access
```

**Purpose**: Central point to provision clients without leaking configuration.

---

### 2.2 TenantAwareESClient

**File**: `TenantAwareESClient.ts`

**Responsibility**: Enforce tenant isolation on all ES operations.

**Key Methods**:

- `search()`: Adds `tenantId` filter to query
- `index()`: Adds `tenantId` stamp to document
- `bulk()`: Bulk operations with tenant routing
- `delete()` / `deleteByQuery()`: Tenant-filtered deletes

**Tenant Guard Mechanism**:

```typescript
applyTenantGuard(query): QueryDslQueryContainer
// Wraps any query in a bool filter:
// { bool: { must: [originalQuery], filter: [{ term: { tenantId } }] } }
```

**Document Stamping**:

```typescript
stampTenantId(document): Record<string, unknown>
// Adds tenantId field to every indexed document
// { ...document, tenantId: this.tenantId }
```

**Document ID Prefixing**:

```typescript
buildDocumentId(id): string
// Returns: `${tenantId}__${id}`
// Ensures uniqueness across tenants in same index
```

---

### 2.3 MongoSlotsDAO (Slots Management)

**File**: `MongoSlotsDAO.ts`

**Responsibility**: Manage slot assignments in MongoDB collection `elasticSlots`.

**Slot Document Structure**:

```json
{
  "_id": ObjectId,
  "type": "string",          // PropertyType (e.g., "text", "numeric", "select")
  "slotName": "string_1",    // Slot identifier
  "assignedTo": "propertyName" // null if unassigned, property name if assigned
}
```

**Key Operations**:

1. **assignSlot(propertyName, type)**
   - Finds first unassigned slot of that type
   - Sets `assignedTo = propertyName`
   - Ensures 1:1 mapping (unique constraint on `assignedTo`)

2. **unassignSlot(propertyName)**
   - Releases slot when property deleted
   - Sets `assignedTo = null`

3. **updatePropertyName(oldName, newName)**
   - Updates slot assignment when property renamed
   - Maintains slot-to-property consistency

4. **getSlotMap()**
   - Returns cached Map<propertyName, SlotDocument>
   - Cache per tenant (key: `tenantName`)
   - Used during indexing to map properties to slots

**Index Strategy**:

- Unique index on `slotName` (no duplicate slots)
- Partial unique index on `assignedTo` (only for assigned slots, ignoring `null` values)

---

### 2.4 MongoSlotsBootstrapper

**File**: `MongoSlotsBootstrapper.ts`

**Responsibility**: Initialize slots on system start.

**Process**:

1. Reads `SlotBootstrapDefinitions` to determine needed slots
2. For each slot type, creates N slots (e.g., 50 text slots, 40 numeric slots)
3. Uses `upsert` to safely create only if not exists
4. Creates indexes for performance

**Bootstrap Definition**: `SlotBootstrapDefinitions`

- Defines slot types and count per type
- Example: `{ text: 50, numeric: 40, select: 30 }`
- Converts slot types to ES property types

---

### 2.5 EntityIndexMappingDefinition

**File**: `EntityIndexMappingDefinition.ts`

**Responsibility**: Define ES index structure.

**Index Configuration**:

```typescript
{
  alias: 'entities',
  physicalPrefix: 'entities',
  settings: {
    number_of_shards: 6,
    number_of_replicas: 1,
    index.mapping.total_fields.limit: 4500,  // Field cap
    analysis: { /* language-specific analyzers */ }
  },
  mappings: {
    _routing: { required: true },  // Tenant-based routing
    properties: {
      tenantId: { type: 'keyword' },
      sharedId: { type: 'keyword' },
      template: { type: 'keyword' },
      title: { type: 'text', /* ... */ },
      metadata: { properties: { /* slots mapped here */ } },
      // NO per-property fields, only slot fields
    }
  }
}
```

**Critical**: Metadata mapping is **generated from available slots**, not hard-coded per property.

---

### 2.6 EntityIndexerService

**File**: `EntityIndexerService.ts`

**Responsibility**: Transform entities to ES documents and bulk index them.

**Dependencies**:

- `esClient: TenantAwareESClient` (for indexing)
- `slotsDAO: MongoSlotsDAO` (for slot map)

**Indexing Flow**:

```
EntityIndexerService.index(entities[])
├── 1. Fetch slot map: Map<propertyName, SlotDocument>
├── 2. Transform entities to ES docs:
│   └── EntityElasticDocumentMapper.toDocuments(entities, slotMap)
│       ├── For each entity's metadata property:
│       │   └── Look up property in slotMap
│       │       └── Write value to slot field (e.g., metadata.string_1)
│       └── Return transformed docs
├── 3. Bulk index to ES:
│   └── esClient.bulk({
│       operations: [{ id, document }, ...],
│       routing: tenantId
│     })
└── Returns success or throws BulkIndexingError
```

**Delete Flow**:

```
EntityIndexerService.delete(sharedIds[])
├── Build deleteByQuery with sharedId terms filter
├── Apply tenant guard (automatically by TenantAwareESClient)
└── Execute delete with tenant routing
```

---

## 3. Component Interaction Flow

### 3.1 Indexing a New Entity

```
1. Entity created in MongoDB
   ↓
2. IndexerService.index([entity])
   ├── Fetch slot map from MongoSlotsDAO
   │   └── Cache hit: return Map<propertyName, SlotDocument>
   ├── EntityElasticDocumentMapper.toDocuments(entities, slotMap)
   │   ├── For each metadata property (e.g., "priority")
   │   │   ├── Find slotMap["priority"] → SlotDocument
   │   │   └── Extract slotName (e.g., "select_2")
   │   │       └── Write to document.metadata.select_2 = value
   │   └── Return transformed document
   ├── TenantAwareESClient.bulk()
   │   ├── Add tenantId stamp: doc.tenantId = tenantId
   │   ├── Build ID: `${tenantId}__${entityId}`
   │   └── Index to ES with tenant routing
   └── Complete
```

### 3.2 Searching (Query-Time)

```
SearchQuery arrives
   ↓
1. TenantAwareESClient.search(options)
   ├── Fetch slot map (cache hit → instant)
   ├── Translate query: "priority contains 'high'"
   │   └── Resolve: priority → select_2 in ES
   ├── rewrite query to search metadata.select_2
   ├── applyTenantGuard():
   │   └── { bool: { must: [rewritten query], filter: [{ term: { tenantId } }] } }
   └── Send to ES with tenant routing
   ↓
2. ES executes query, applying tenant isolation
   ├── Only searches documents where tenantId == requestingTenant
   └── Returns results
```

### 3.3 Property Rename

```
Property "priority" renamed to "urgency"
   ↓
1. Update in MongoDB template
   ↓
2. MongoSlotsDAO.updatePropertyName("priority", "urgency")
   ├── Find slot assigned to "priority"
   ├── Update slot: assignedTo = "urgency"
   └── invalidateCache() → clear Map for this tenant
   ↓
3. On next index/search:
   ├── Slot map cache miss → refetch from MongoDB
   ├── New mapping: "urgency" → select_2
   └── Queries now use updated slot mapping
```

---

## 4. Slots System Critical Design Decisions

### Why Slots Are Essential, Not Optional

| Scenario              | Without Slots             | With Slots                                        |
| --------------------- | ------------------------- | ------------------------------------------------- |
| 100 custom properties | 100 ES metadata fields    | ~10 slots (reused)                                |
| Tenant scaling        | Fields explode per tenant | Fixed slots per tenant                            |
| Template changes      | Reindex to add field      | No reindex, just reassign slot                    |
| Field limit breach    | Schema failure            | Graceful degradation (out of slots → clear error) |

### Slot Lifecycle

```
1. Bootstrap Phase:
   MongoSlotsBootstrapper → Creates N unassigned slots

2. Property Creation:
   Template property added
   → MongoSlotsDAO.assignSlot(propertyName, type)
   → Finds unassigned slot of type T, assigns it

3. Indexing Phase:
   Entity indexed
   → EntityElasticDocumentMapper resolves: propertyName → slotName
   → Writes to metadata[slotName]

4. Query Phase:
   Search "propertyName = X"
   → TenantAwareESClient translates: "metadata.propertyName" → "metadata.slotName"
   → Executes query on slot field

5. Property Deletion:
   Property removed from template
   → MongoSlotsDAO.unassignSlot(propertyName)
   → Sets assignedTo = null, slot becomes available for reuse
```

---

## 5. Multi-Tenancy Implementation

### Tenant Isolation Layers

| Layer                  | Mechanism                         | Code                          |
| ---------------------- | --------------------------------- | ----------------------------- |
| **Document Isolation** | `tenantId` field + term filter    | `applyTenantGuard()`          |
| **Routing**            | Tenant-based routing for locality | `routing: tenantId`           |
| **ID Namespacing**     | `${tenantId}__${id}`              | `buildDocumentId()`           |
| **Index Selection**    | Per-tenant index (if configured)  | `IndexNameResolver.resolve()` |
| **Slot Management**    | Per-tenant slot map cache         | `slotsCache.get(tenantName)`  |

### Shared Index with Tenant Filter Example

**Index**: Single ES index for all tenants (with 4500 field limit)
**Isolation**: Every query adds `{ term: { tenantId } }` filter

```typescript
// Search request for Tenant A
query: { match: { fullText: "report" } }

// Becomes:
{
  bool: {
    must: [{ match: { fullText: "report" } }],
    filter: [{ term: { tenantId: "tenant-a" } }]
  }
}

// Only documents with tenantId: "tenant-a" match, Tenant B's data is invisible
```

---

## 6. Cache Strategy

### Slot Map Caching

```typescript
slotsCache: Map<tenantName, SlotMap>
// SlotMap = Map<propertyName, SlotDocument>

// First access: Cache miss
getSlotMap() → MongoDB query → populate cache → return

// Subsequent accesses: Cache hit (instant)
getSlotMap() → return from slotsCache

// On property changes (rename/create/delete):
invalidateCache() → delete tenantName from cache

// Next access: Refetch updated mapping
```

**Performance Impact**:

- First indexing operation: ~100ms MongoDB query
- Subsequent operations: <1ms (in-memory map lookup)
- Invalidation triggers: Property schema changes (rare compared to indexing frequency)

---

## 7. Error Handling & Edge Cases

### Bulk Indexing Failures

```typescript
bulk() {
  const response = await client.bulk()
  if (response.body.errors) {
    console.log('Bulk indexing errors', {
      failedItems: filter error items
    })
    throw new BulkIndexingError()
  }
}
```

**Issue**: Individual item errors are logged but bulk fails entirely.
**Improvement Needed**: Partial success handling / retry logic for failed items.

### Slot Exhaustion

If all slots of a type are assigned and new property of that type is created:

- `assignSlot()` finds no unassigned slot
- Throws: `"No available slots for type ${type}"`
- Property creation fails
- **Recovery**: Increase slot count via `AmountPerSlotType` and re-bootstrap

### Constraint Violations

MongoDB index on `assignedTo` ensures uniqueness:

```
unique: true, partialFilterExpression: { assignedTo: { $type: 'string' } }
```

- Prevents: Two properties assigned to same slot
- Allows: Multiple `null` values (unassigned slots)

---

## 8. Dependency Graph

```
Application Code
    ↓
ElasticSearchClientFactory (facade)
    ├── tenantAware(tenantId)
    │   └── TenantAwareESClient
    │       ├── depends on: Client (ES client)
    │       └── depends on: IndexNameResolver
    │
    └── authorizedEntityClient(tenantId, actor)
        └── AuthorizedEntityESClient
            └── wraps TenantAwareESClient

EntityIndexerService
    ├── depends on: TenantAwareESClient (for bulk ops)
    └── depends on: MongoSlotsDAO (for slot map)
        └── depends on: MongoDB (elasticSlots collection)

MongoSlotsBootstrapper
    ├── depends on: MongoDB (create elasticSlots collection)
    └── runs once: system startup/initialization

EntityElasticDocumentMapper
    └── reads: SlotMap (from MongoSlotsDAO)
        └── transforms: Entity → ES document (properties → slots)
```

---

## 9. Summary: Slots Architecture Criticality

### Why Slots Cannot Be Removed

1. **Field Limit Adherence**: Without slots, field count = properties × types × tenants (unbounded)
2. **Query Complexity**: Queries need to resolve property names to actual ES fields
3. **Template Flexibility**: Properties can be added/removed without reindexing if using slots
4. **Scalability**: Hundreds of properties per template → single digit slots per type

### When to Revisit Slots Design

- Slot budget exhausted: Increase `AmountPerSlotType` in `SlotBootstrapDefinitions`
- Performance bottleneck: Slot map cache hits expected ~99%+ of indexing operations
- New property types: Add to `SlotBootstrapDefinitions`, re-bootstrap on next deployment

---

## 10. API Integration Points

| Service                      | Method          | Input                 | Output                | Tenant Context      |
| ---------------------------- | --------------- | --------------------- | --------------------- | ------------------- |
| `ElasticSearchClientFactory` | `tenantAware()` | `tenantId: string`    | `TenantAwareESClient` | Implicit            |
| `TenantAwareESClient`        | `search()`      | `SearchOptions`       | `SearchResponse<T>`   | Filtered            |
| `TenantAwareESClient`        | `bulk()`        | `BulkOptions`         | `void`                | Routed              |
| `EntityIndexerService`       | `index()`       | `EntityDBO[]`         | `void`                | Via client          |
| `EntityIndexerService`       | `delete()`      | `sharedIds: string[]` | `void`                | Via client          |
| `MongoSlotsDAO`              | `assignSlot()`  | `propertyName, type`  | `void`                | Implicit            |
| `MongoSlotsDAO`              | `getSlotMap()`  | —                     | `SlotMap`             | Tenant-scoped cache |

---

## 11. Question Resolution

**Q: How important is slots management?**
**A**: **CRITICAL**. Slots are the architectural foundation enabling bounded ES indices while supporting unlimited properties. Removing slots would require either:

1. Hard-coding all possible fields (inflexible)
2. Creating fields dynamically (field limit breach on scale)
3. Using nested objects (query complexity explosion)

The property-to-slot mapping is not a nice-to-have optimization; it's a **prerequisite for multi-tenancy and scalability**.
