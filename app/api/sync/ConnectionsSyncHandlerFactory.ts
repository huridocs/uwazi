import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoConnectionsSyncHandler } from './MongoConnectionsSyncHandler.js';
import { PostgresConnectionsSyncHandler } from './PostgresConnectionsSyncHandler.js';
import { ConnectionsSyncHandler } from './ConnectionsSyncHandler.js';

export class ConnectionsSyncHandlerFactory {
  static default(): ConnectionsSyncHandler {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresCore) {
      return new PostgresConnectionsSyncHandler({
        tenantId: tenant.name,
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
      });
    }

    return new MongoConnectionsSyncHandler();
  }
}
