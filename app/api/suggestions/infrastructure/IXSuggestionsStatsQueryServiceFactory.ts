import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { isPostgresCoreActive } from '#api/core/libs/featureFlags.js';
import {
  mongoTransactionManager,
  postgresTransactionManager,
} from '#api/services/informationextraction/infrastructure/contextTransactionManagers.js';
import { IXSuggestionsStatsQueryService } from '../domain/IXSuggestionsStatsQueryService.js';
import { MongoIXSuggestionsStatsQueryService } from './MongoIXSuggestionsStatsQueryService.js';
import { PostgresIXSuggestionsStatsQueryService } from './PostgresIXSuggestionsStatsQueryService.js';

class IXSuggestionsStatsQueryServiceFactory {
  static default(): IXSuggestionsStatsQueryService {
    if (isPostgresCoreActive()) {
      return new PostgresIXSuggestionsStatsQueryService({
        tenantId: ExecutionContext.currentTenant.name,
        pgTransactionManager: postgresTransactionManager(),
      });
    }

    return new MongoIXSuggestionsStatsQueryService({
      db: getConnection(),
      transactionManager: mongoTransactionManager(),
    });
  }
}

export { IXSuggestionsStatsQueryServiceFactory };
