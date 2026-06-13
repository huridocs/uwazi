# Dataviz module — technical debt

## Dependencies on core (intentional during V2 migration)

- **Entity queries:** `MongoDatavizQueryExecutor` aggregates the legacy `entities` collection. A future adapter could target a core read API instead of querying Mongo directly.
- **Settings:** `SettingsDataSource` from core is used for private-instance policy and multilingual label resolution in the query executor.
- **Shared runtime:** `ExecutionContext`, `TransactionManager`, `JobsDispatcher`, and `AbstractUseCase` remain in `app/api/core` per platform conventions.

## Public embed constraints

- Charts with `refreshMode: live` and no snapshot return **503** on `GET /api/public/dataviz/:id/data`. Admins should refresh or switch to snapshot mode before external embedding.
