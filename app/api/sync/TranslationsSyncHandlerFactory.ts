import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTranslationsSyncHandler } from './MongoTranslationsSyncHandler.js';
import { PostgresTranslationsSyncHandler } from './PostgresTranslationsSyncHandler.js';

export class TranslationsSyncHandlerFactory {
  static default(): MongoTranslationsSyncHandler | PostgresTranslationsSyncHandler {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresCore) {
      return new PostgresTranslationsSyncHandler({
        tenantId: tenant.name,
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
      });
    }

    return new MongoTranslationsSyncHandler();
  }
}
