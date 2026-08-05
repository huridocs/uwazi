# Relationship Types V2 Migration Context

## Objective

Migrate relationship types backend logic to v2 architecture so the module can later move to Postgres with the same public API contract used today.

**Postgres phase (next):** see [`relationship-types-postgres.md`](./relationship-types-postgres.md).

## Scope

- Backend-only (`app/api`).
- Keep endpoint names and response/request contracts identical for `/api/relationtypes`.
- No runtime support for legacy `relationtypes.properties` behavior in the target v2 implementation.
- Data cleanup of legacy `relationtypes.properties` and `connections.metadata` is handled by tenant migration `200-remove-legacy-relationshiptype-properties-and-connection-metadata`.
- Internally split mutation flows into explicit `create` and `update` use cases (no internal upsert).

## Current Diagnosis

- Relationship types v2 logic now lives in `app/api/core` (domain/application/infrastructure/factories/express).
- `/api/relationtypes` is now routed through v2 controllers/use cases while preserving the same external contract.
- Legacy relationship type properties (`properties`) are accepted at the HTTP boundary for compatibility but intentionally ignored internally.

## Decision Record (Current Working Decision)

- Treat `relationtypes.properties` as deprecated legacy data.
- Target implementation provides no first-class support for relationtype property semantics.
- Production data cleanup is tenant migration `200`: `$unset` `relationtypes.properties` and `connections.metadata` where present (`requiresSchema: 5`, `reindex: false`).

## Architecture Reference

- Folder/module structure reference: `app/api/csv.v2`
- Business logic and use case patterns reference: `app/api/core` entities/templates v2 code
- Mutation split compatibility reference: template mutation pattern in
  - `app/api/core/infrastructure/express/template/TemplateMutationController.ts`
  - `app/api/core/infrastructure/facades/TemplateFacade.ts`
  - `app/api/core/application/CreateTemplate.ts`
  - `app/api/core/application/UpdateTemplate.ts`

## Target Hex Architecture (Relationship Types v2 in core)

- **Domain**
  - `RelationshipType` model (`id`, `name`) as core aggregate root.
- **Application**
  - Dedicated use cases:
    - `CreateRelationshipTypeUseCase`
    - `UpdateRelationshipTypeUseCase`
    - `DeleteRelationshipTypeUseCase`
    - `GetRelationshipTypesUseCase`
  - Contract-driven dependencies:
    - `RelationshipTypesDataSource`
    - `RelationshipTypesTranslationService`
- **Infrastructure**
  - Mongo datasource adapter implementing read + write contract methods.
  - Legacy translation adapter implementing application translation contract.
  - Use-case factories wiring transaction manager and adapters.
  - HTTP controllers with Zod parsing through `AbstractController`.
  - No dedicated facade layer for relationshiptypes v2 (controllers call use-case factories directly).
  - HTTP compatibility layer:
    - keep single `POST /api/relationtypes` route
    - internally branch create/update by `_id` presence in route dispatcher to dedicated create/update controllers

## Delivery Phases

1. V2 architecture migration (Mongo):
   - introduce v2 route/controller layer
   - move relationtypes behavior into v2-oriented module structure
   - keep `/api/relationtypes` contract stable
2. Postgres phase:
   - tracked in [`relationship-types-postgres.md`](./relationship-types-postgres.md)
   - schema + RLS, PG DataSource, per-tenant feature flag, sync handler, one-time Mongo→PG data copy

## TODOs

- [x] Build v2 route/controller layer for `/api/relationtypes` with unchanged contract and zod parsing.
- [x] Keep single compatibility POST route but route internally to separate create/update use cases.
- [x] Implement v2 CRUD use cases and datasource shape (no internal upsert).
- [x] Move delete guards and translation behavior needed by current contract.
- [x] Remove legacy V1 relationshiptypes code.
- [x] Migrate runtime calls from legacy V1 relationshiptypes code into v2.
- [x] Move relationshiptypes v2 implementation into `app/api/core` structure.
- [x] Add v2 test suites for routes/use-cases/datasource and keep cross-module behavior stable.
- [x] Revisit DELETE semantics for in-use relation types:
  - now returns `400` with `Cannot delete type being used in relationships` when linked to relationships
  - now returns `400` with `Cannot delete type being used in relationship queries` when referenced by relationship queries
- [x] Add tenant data migration to remove legacy `relationtypes.properties` and `connections.metadata`.

## Current Implementation Notes

- The v2 HTTP layer is now controller-based and uses Zod schemas at controller boundaries inside `app/api/core/infrastructure/express/relationshipType`.
- `POST /api/relationtypes` is now a compatibility mutation endpoint that delegates to:
  - `create` use case when `_id` is missing
  - `update` use case when `_id` is present
- Internal naming and flow now follow create/update semantics, mirroring templates v2 patterns.
- Legacy translation context updates are now tested through real persistence behavior (integration tests), not method spies.
- `DELETE /api/relationtypes` now returns explicit client errors for in-use relation types instead of `200 false`.

## Test Status

- Relationshiptypes v2 test coverage now includes:
  - application use cases (`Create`, `Update`, `Get`, `Delete`)
  - Mongo datasource and default datasource factory
  - HTTP routes/controllers and Zod schemas
  - translation adapter behavior via persisted translation context changes
  - model, mapper, and error files
  - parity scenarios ported from removed v1 relationtypes tests (excluding `.properties` behavior by design)
- Current test policy for this module:
  - prefer integration tests over mocks/spies
  - allow auth middleware mocking in route tests to isolate the HTTP contract surface
- Current run status:
  - targeted v2 regression set passing (`core` relationship type suites, `syncWorker`, `relationships`, `PXCreateExtractor`, `ServerRelationshipTypesService`) with all suites green.

## Legacy Sweep (Final)

- No remaining runtime imports of `#api/relationtypes`.
- Legacy `app/api/relationtypes` module has been removed.
- Runtime relationship-type routes/factories/use cases now resolve from `app/api/core`.
- Remaining `relationtypes` naming is intentional compatibility surface:
  - Mongo collection name: `relationtypes`
  - sync namespace/config key: `relationtypes`
  - API route path: `/api/relationtypes`
  - activity log route keys for `/api/relationtypes`
- `LegacyRelationshipTypesTranslationService` remains intentionally named as an infrastructure adapter to existing translations behavior.
- `properties` is only accepted at request-schema boundary for compatibility and ignored internally.

## V2 Complete Checklist

- [x] `/api/relationtypes` served by core controller/use-case flow (`app/api/core/infrastructure/express/relationshipType`).
- [x] Create/update internally split into distinct use cases.
- [x] Runtime callers migrated from legacy relationtypes module to v2 paths.
- [x] Legacy `app/api/relationtypes` runtime module removed.
- [x] Relationship types v2 module ownership moved to `app/api/core`.
- [x] Contract-compatible route behavior validated through integration tests.
- [x] End-to-end contract parity lifecycle test present (create/get/update/delete).
- [x] Translation side effects validated through integration tests.
- [x] No internal mocks in relationshiptypes v2 tests (except auth middleware in route tests).
- [x] In-use delete cases return explicit `400` errors with relationship-focused wording.

## Explicit Non-Goals (Current Scope)

- Do not reintroduce runtime support for `relationtypes.properties`.
- Postgres implementation details live in [`relationship-types-postgres.md`](./relationship-types-postgres.md) (not in this V2 architecture doc).

## To Keep an Eye On

- Final confirmation that dropping relationtype property behavior is acceptable for all external consumers.
- After migration `200` runs in prod, HubRelationshipMetadata extended metadata UI will no longer render connection `metadata` (by design).
- Keep enforcing "no internal mocks" in relationshiptypes v2 tests unless crossing module/system boundaries (auth/socket/etc).
- Remaining legacy relationtypes references are now test-only; runtime callers are migrated to core-based v2 implementation.
- Keep temporary `notify: true` in relationship type controller error logs until monitoring validation is complete; then remove notify flag and keep logs.
- Postgres follow-up: open decisions and implementation checklist in [`relationship-types-postgres.md`](./relationship-types-postgres.md).
