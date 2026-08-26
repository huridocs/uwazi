import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTranslationsSyncHandler } from './MongoTranslationsSyncHandler.js';
import { PostgresTranslationsSyncHandler } from './PostgresTranslationsSyncHandler.js';

export class TranslationsSyncHandlerFactory {
  static default(): MongoTranslationsSyncHandler | PostgresTranslationsSyncHandler {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresTranslations) {
      return new PostgresTranslationsSyncHandler({
        tenantId: tenant.name,
        mongoDb: getConnection(),
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
      });
    }

    return new MongoTranslationsSyncHandler();
  }
}
