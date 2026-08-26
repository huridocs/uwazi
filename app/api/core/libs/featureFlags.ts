import { ExecutionContext } from './ExecutionContext.js';

/**
 * Whether the current tenant has the entities-to-Postgres migration active.
 *
 * The legacy Mongo-write denormalization (app/api/entities/denormalize.ts) is
 * deferred for the Postgres pipeline, so its triggers must no-op while this
 * flag is on: the Mongo entities collection is no longer the source of truth
 * and there is no Postgres-side denormalization yet.
 */
export const isPostgresEntitiesActive = (): boolean =>
  Boolean(ExecutionContext.currentTenant.featureFlags?.postgresEntities);
