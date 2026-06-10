import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PostgresConnectionFactory } from '#api/core/infrastructure/factories/PostgresConnectionFactory.js';
import { MongoThesauriSyncHandler } from './MongoThesauriSyncHandler.js';
import { PostgresThesauriSyncHandler } from './PostgresThesauriSyncHandler.js';

export class ThesauriSyncHandlerFactory {
  static default(): MongoThesauriSyncHandler | PostgresThesauriSyncHandler {
    const { tenant } = ExecutionContext;

    if (tenant.featureFlags?.postgresThesauri) {
      return new PostgresThesauriSyncHandler({
        connection: PostgresConnectionFactory.connectionConfig(tenant.dbName),
        tenantId: tenant.name,
      });
    }

    return new MongoThesauriSyncHandler();
  }
}
