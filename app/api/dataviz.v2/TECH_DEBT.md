# Dataviz module — technical debt

## Dependencies on core (intentional during V2 migration)

- **Entity queries:** `MongoDatavizQueryExecutor` aggregates the legacy `entities` collection. A future adapter could target a core read API instead of querying Mongo directly.
- **Settings:** `SettingsDataSource` from core is used for private-instance policy and multilingual label resolution in the query executor.
- **Shared runtime:** `ExecutionContext`, `TransactionManager`, `JobsDispatcher`, and `AbstractUseCase` remain in `app/api/core` per platform conventions.

## Public embed constraints

- The public embed path (`GET /api/public/dataviz/:id/data`) never executes live queries; it reads `dataviz_snapshots` only.
- **Save (create/update) persists a snapshot** when the visualization definition changes (query, chart, appearance, manual data), so embeds work after a successful save without a separate Refresh click.
- **Manual refresh** re-runs the query against the current collection when underlying data has changed (new or updated entities). It is not the primary path for definition changes—save handles those.
- **503** is returned when no snapshot exists (e.g. deleted), when save/snapshot generation failed, or while a manual refresh is in progress (`processing.active`).
