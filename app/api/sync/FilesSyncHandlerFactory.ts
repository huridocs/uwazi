import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoFilesSyncHandler } from './MongoFilesSyncHandler.js';
import { PostgresFilesSyncHandler } from './PostgresFilesSyncHandler.js';

export class FilesSyncHandlerFactory {
  static default(): MongoFilesSyncHandler | PostgresFilesSyncHandler {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresFiles) {
      return new PostgresFilesSyncHandler({
        tenantId: tenant.name,
        mongoDb: getConnection(),
      });
    }

    return new MongoFilesSyncHandler();
  }
}
