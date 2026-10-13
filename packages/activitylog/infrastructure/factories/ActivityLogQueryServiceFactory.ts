import { PostgresTransactionManagerFactory } from '#api/core/infrastructure/factories/PostgresTransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import type { ActivityLogQueryService } from '../../application/contracts/ActivityLogQueryService.js';
import { MongoActivityLogQueryService } from '../mongodb/MongoActivityLogQueryService.js';
import { PostgresActivityLogQueryService } from '../postgresql/PostgresActivityLogQueryService.js';
import { ActivityDescriberFactory } from './ActivityDescriberFactory.js';

/**
 * The query service for the current tenant's backend, chosen by its `postgresCore` flag. Outside
 * an execution context (the CLI's legacy paths) a fresh transaction manager is built, as the core
 * factories do.
 */
class ActivityLogQueryServiceFactory {
  static default(): ActivityLogQueryService {
    const tenant = ExecutionContext.currentTenant;
    const describer = ActivityDescriberFactory.default();

    if (tenant.featureFlags?.postgresCore) {
      return new PostgresActivityLogQueryService(
        {
          tenantId: tenant.name,
          pgTransactionManager: ExecutionContext.getStore()
            ? ExecutionContext.postgresTransactionManager
            : PostgresTransactionManagerFactory.default(),
          accessContext: ExecutionContext.accessContext,
        },
        describer
      );
    }

    return new MongoActivityLogQueryService(getConnection(), describer);
  }
}

export { ActivityLogQueryServiceFactory };
