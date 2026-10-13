import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoEntitiesSyncHandler } from './MongoEntitiesSyncHandler.js';
import { PostgresEntitiesSyncHandler } from './PostgresEntitiesSyncHandler.js';

export class EntitiesSyncHandlerFactory {
  static default(): MongoEntitiesSyncHandler | PostgresEntitiesSyncHandler {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresCore) {
      return new PostgresEntitiesSyncHandler({
        tenantId: tenant.name,
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
        accessContext: ExecutionContext.accessContext,
      });
    }

    return new MongoEntitiesSyncHandler();
  }
}
