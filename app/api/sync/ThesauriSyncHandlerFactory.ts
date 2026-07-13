import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { PostgresTransactionManagerFactory } from '#api/core/infrastructure/factories/PostgresTransactionManagerFactory.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import { MongoThesauriSyncHandler } from './MongoThesauriSyncHandler.js';
import { PostgresThesauriSyncHandler } from './PostgresThesauriSyncHandler.js';

export class ThesauriSyncHandlerFactory {
  static default(): MongoThesauriSyncHandler | PostgresThesauriSyncHandler {
    const { tenant } = ExecutionContext;

    if (tenant.featureFlags?.postgresThesauri) {
      return new PostgresThesauriSyncHandler({
        tenantId: tenant.name,
        mongoDb: getConnection(),
        pgTransactionManager: ExecutionContext.postgresTransactionManager as PostgresTransactionManager,
      });
    }

    return new MongoThesauriSyncHandler();
  }
}
