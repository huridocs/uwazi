import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoRelationshipTypesSyncHandler } from './MongoRelationshipTypesSyncHandler.js';
import { PostgresRelationshipTypesSyncHandler } from './PostgresRelationshipTypesSyncHandler.js';

export class RelationshipTypesSyncHandlerFactory {
  static default(): MongoRelationshipTypesSyncHandler | PostgresRelationshipTypesSyncHandler {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresRelationshipTypes) {
      return new PostgresRelationshipTypesSyncHandler({
        tenantId: tenant.name,
        mongoDb: getConnection(),
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
      });
    }

    return new MongoRelationshipTypesSyncHandler();
  }
}
