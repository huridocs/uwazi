import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoRelationshipTypesSyncHandler } from './MongoRelationshipTypesSyncHandler.js';
import { PostgresRelationshipTypesSyncHandler } from './PostgresRelationshipTypesSyncHandler.js';

export class RelationshipTypesSyncHandlerFactory {
  static default(): MongoRelationshipTypesSyncHandler | PostgresRelationshipTypesSyncHandler {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresCore) {
      return new PostgresRelationshipTypesSyncHandler({
        tenantId: tenant.name,
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
      });
    }

    return new MongoRelationshipTypesSyncHandler();
  }
}
