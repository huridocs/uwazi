import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PostgresTransactionManagerFactory } from '#api/core/infrastructure/factories/PostgresTransactionManagerFactory.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { MongoFilesSyncHandler } from './MongoFilesSyncHandler.js';
import { PostgresFilesSyncHandler } from './PostgresFilesSyncHandler.js';

export class FilesSyncHandlerFactory {
  static default(): MongoFilesSyncHandler | PostgresFilesSyncHandler {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresFiles) {
      return new PostgresFilesSyncHandler({
        tenantId: tenant.name,
        pgTransactionManager: ExecutionContext.postgresTransactionManager as PostgresTransactionManager,
      });
    }

    return new MongoFilesSyncHandler();
  }
}
