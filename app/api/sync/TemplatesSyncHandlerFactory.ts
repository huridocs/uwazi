import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTemplatesSyncHandler } from './MongoTemplatesSyncHandler.js';
import { PostgresTemplatesSyncHandler } from './PostgresTemplatesSyncHandler.js';

export class TemplatesSyncHandlerFactory {
  static default(): MongoTemplatesSyncHandler | PostgresTemplatesSyncHandler {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresCore) {
      return new PostgresTemplatesSyncHandler({
        tenantId: tenant.name,
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
      });
    }

    return new MongoTemplatesSyncHandler();
  }
}
