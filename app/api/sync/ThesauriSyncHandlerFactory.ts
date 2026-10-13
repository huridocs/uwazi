import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoThesauriSyncHandler } from './MongoThesauriSyncHandler.js';
import { PostgresThesauriSyncHandler } from './PostgresThesauriSyncHandler.js';

export class ThesauriSyncHandlerFactory {
  static default(): MongoThesauriSyncHandler | PostgresThesauriSyncHandler {
    const { tenant } = ExecutionContext;

    if (tenant.featureFlags?.postgresCore) {
      return new PostgresThesauriSyncHandler({
        tenantId: tenant.name,
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
      });
    }

    return new MongoThesauriSyncHandler();
  }
}
