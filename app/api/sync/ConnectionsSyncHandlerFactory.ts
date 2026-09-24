import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoConnectionsSyncHandler } from './MongoConnectionsSyncHandler.js';
import { PostgresConnectionsSyncHandler } from './PostgresConnectionsSyncHandler.js';
import { ConnectionsSyncHandler } from './ConnectionsSyncHandler.js';

export class ConnectionsSyncHandlerFactory {
  static default(): ConnectionsSyncHandler {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresCore) {
      return new PostgresConnectionsSyncHandler({
        tenantId: tenant.name,
        mongoDb: getConnection(),
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
      });
    }

    return new MongoConnectionsSyncHandler();
  }
}
