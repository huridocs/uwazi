import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { isPostgresCoreActive } from '#api/core/libs/featureFlags.js';
import {
  mongoTransactionManager,
  postgresTransactionManager,
} from '#api/services/informationextraction/infrastructure/contextTransactionManagers.js';
import { IXSuggestionsTableQueryService } from '../domain/IXSuggestionsTableQueryService.js';
import { MongoIXSuggestionsTableQueryService } from './MongoIXSuggestionsTableQueryService.js';
import { PostgresIXSuggestionsTableQueryService } from './PostgresIXSuggestionsTableQueryService.js';

class IXSuggestionsTableQueryServiceFactory {
  static default(): IXSuggestionsTableQueryService {
    if (isPostgresCoreActive()) {
      return new PostgresIXSuggestionsTableQueryService({
        tenantId: ExecutionContext.currentTenant.name,
        pgTransactionManager: postgresTransactionManager(),
      });
    }

    return new MongoIXSuggestionsTableQueryService({
      db: getConnection(),
      transactionManager: mongoTransactionManager(),
    });
  }
}

export { IXSuggestionsTableQueryServiceFactory };
