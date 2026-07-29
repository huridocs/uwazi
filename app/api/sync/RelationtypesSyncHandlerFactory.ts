import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoRelationtypesSyncHandler } from './MongoRelationtypesSyncHandler.js';
import { PostgresRelationshipTypesSyncHandler } from './PostgresRelationshipTypesSyncHandler.js';

export class RelationtypesSyncHandlerFactory {
  static default(): MongoRelationtypesSyncHandler | PostgresRelationshipTypesSyncHandler {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresRelationshipTypes) {
      return new PostgresRelationshipTypesSyncHandler({
        tenantId: tenant.name,
        mongoDb: getConnection(),
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
      });
    }

    return new MongoRelationtypesSyncHandler();
  }
}
