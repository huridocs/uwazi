import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PostgresConnectionFactory } from '#api/core/infrastructure/factories/PostgresConnectionFactory.js';
import { MongoDictionariesSyncHandler } from './MongoDictionariesSyncHandler.js';
import { PostgresDictionariesSyncHandler } from './PostgresDictionariesSyncHandler.js';

export class DictionariesSyncHandlerFactory {
  static default(): MongoDictionariesSyncHandler | PostgresDictionariesSyncHandler {
    const tenant = ExecutionContext.tenant;

    if (tenant.featureFlags?.postgresThesauri) {
      return new PostgresDictionariesSyncHandler({
        connection: PostgresConnectionFactory.connectionConfig(tenant.dbName),
        tenantId: tenant.name,
      });
    }

    return new MongoDictionariesSyncHandler();
  }
}
