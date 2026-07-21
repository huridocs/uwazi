import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTemplatesSyncHandler } from './MongoTemplatesSyncHandler.js';
import { PostgresTemplatesSyncHandler } from './PostgresTemplatesSyncHandler.js';

export class TemplatesSyncHandlerFactory {
  static default(): MongoTemplatesSyncHandler | PostgresTemplatesSyncHandler {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresTemplates) {
      return new PostgresTemplatesSyncHandler({
        tenantId: tenant.name,
        mongoDb: getConnection(),
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
      });
    }

    return new MongoTemplatesSyncHandler();
  }
}
