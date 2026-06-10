import { tenants } from '#api/tenants/tenantContext.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { PostgresConnectionFactory } from '#api/core/infrastructure/factories/PostgresConnectionFactory.js';
import { MongoDictionariesSyncHandler } from './MongoDictionariesSyncHandler.js';
import { PostgresDictionariesSyncHandler } from './PostgresDictionariesSyncHandler.js';

export class DictionariesSyncHandlerFactory {
  static default(): MongoDictionariesSyncHandler | PostgresDictionariesSyncHandler {
    if (tenants.current()?.featureFlags?.postgresThesauri) {
      return new PostgresDictionariesSyncHandler(
        PostgresConnectionFactory.default(),
        getConnection()
      );
    }

    return new MongoDictionariesSyncHandler();
  }
}
