# Relationship Types V2 Migration Context

## Objective

Migrate relationship types backend logic to v2 architecture so the module can later move to Postgres with the same public API contract used today.

## Scope

- Backend-only (`app/api`).
- Keep endpoint names and response/request contracts identical for `/api/relationtypes`.
- No runtime support for legacy `relationtypes.properties` behavior in the target v2 implementation.
- Do not implement cleanup logic for legacy `relationtypes.properties` or `connections.metadata` in this migration scope.
- Internally split mutation flows into explicit `create` and `update` use cases (no internal upsert).

## Current Diagnosis

- `app/api/relationshiptypes.v2` now contains full CRUD-oriented application/infrastructure wiring.
- `/api/relationtypes` is now routed through v2 controllers/use cases while preserving the same external contract.
- Legacy relationship type properties (`properties`) are accepted at the HTTP boundary for compatibility but intentionally ignored internally.

## Decision Record (Current Working Decision)

- Treat `relationtypes.properties` as deprecated legacy data.
- Target implementation provides no first-class support for relationtype property semantics.
- Assume production data cleanup is handled separately; migration code should not spend effort supporting or transforming `relationtypes.properties` or `connections.metadata`.

## Architecture Reference

- Folder/module structure reference: `app/api/csv.v2`
- Business logic and use case patterns reference: `app/api/core` entities/templates v2 code
- Mutation split compatibility reference: template mutation pattern in
  - `app/api/core/infrastructure/express/template/TemplateMutationController.ts`
  - `app/api/core/infrastructure/facades/TemplateFacade.ts`
  - `app/api/core/application/CreateTemplate.ts`
  - `app/api/core/application/UpdateTemplate.ts`

## Target Hex Architecture (Relationship Types v2)

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
    - internally branch create/update by `_id` presence in `RelationshipTypeMutationController`

## Delivery Phases

1. V2 architecture migration (Mongo):
   - introduce v2 route/controller layer
   - move relationtypes behavior into v2-oriented module structure
   - keep `/api/relationtypes` contract stable
2. Postgres phase:
   - add Postgres adapter after v2 parity and cleanup

## TODOs

- [x] Build v2 route/controller layer for `/api/relationtypes` with unchanged contract and zod parsing.
- [x] Keep single compatibility POST route but route internally to separate create/update use cases.
- [x] Implement v2 CRUD use cases and datasource shape (no internal upsert).
- [x] Move delete guards and translation behavior needed by current contract.
- [ ] Remove legacy V1 relationshiptypes code.
- [ ] Migrate calls from legacy V1 relationshiptypes code into v2.
- [x] Add v2 test suites for routes/use-cases/datasource and keep cross-module behavior stable.

## Current Implementation Notes

- The v2 HTTP layer is now controller-based and uses Zod schemas at controller boundaries.
- `POST /api/relationtypes` is now a compatibility mutation endpoint that delegates to:
  - `create` use case when `_id` is missing
  - `update` use case when `_id` is present
- Internal naming and flow now follow create/update semantics, mirroring templates v2 patterns.
- Legacy translation context updates are now tested through real persistence behavior (integration tests), not method spies.

## Test Status

- Relationshiptypes v2 test coverage now includes:
  - application use cases (`Create`, `Update`, `Get`, `Delete`)
  - Mongo datasource and default datasource factory
  - HTTP routes/controllers and Zod schemas
  - translation adapter behavior via persisted translation context changes
  - model, mapper, and error files
- Current test policy for this module:
  - prefer integration tests over mocks/spies
  - allow auth middleware mocking in route tests to isolate the HTTP contract surface
- Current run status:
  - `app/api/relationshiptypes.v2` test suites passing (14 suites / 45 tests).

## To Keep an Eye On

- Final confirmation that dropping relationtype property behavior is acceptable for all external consumers.
- Database cleanup of old `relationtypes.properties` and `connections.metadata` is operational follow-up, not part of this implementation scope.
- Keep enforcing "no internal mocks" in relationshiptypes v2 tests unless crossing module/system boundaries (auth/socket/etc).
