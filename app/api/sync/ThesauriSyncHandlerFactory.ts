import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PostgresConnectionFactory } from '#api/core/infrastructure/factories/PostgresConnectionFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoThesauriSyncHandler } from './MongoThesauriSyncHandler.js';
import { PostgresThesauriSyncHandler } from './PostgresThesauriSyncHandler.js';

export class ThesauriSyncHandlerFactory {
  static default(): MongoThesauriSyncHandler | PostgresThesauriSyncHandler {
    const { tenant } = ExecutionContext;

    if (tenant.featureFlags?.postgresThesauri) {
      return new PostgresThesauriSyncHandler({
        connection: PostgresConnectionFactory.connectionConfig(),
        tenantId: tenant.name,
        mongoDb: getConnection(),
      });
    }

    return new MongoThesauriSyncHandler();
  }
}
