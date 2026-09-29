import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { isPostgresCoreActive } from '#api/core/libs/featureFlags.js';
import {
  mongoTransactionManager,
  postgresTransactionManager,
} from '#api/services/informationextraction/infrastructure/contextTransactionManagers.js';
import { IXSuggestionsSampleQueryService } from '../domain/IXSuggestionsSampleQueryService.js';
import { MongoIXSuggestionsSampleQueryService } from './MongoIXSuggestionsSampleQueryService.js';
import { PostgresIXSuggestionsSampleQueryService } from './PostgresIXSuggestionsSampleQueryService.js';

class IXSuggestionsSampleQueryServiceFactory {
  static default(): IXSuggestionsSampleQueryService {
    if (isPostgresCoreActive()) {
      return new PostgresIXSuggestionsSampleQueryService({
        tenantId: ExecutionContext.currentTenant.name,
        pgTransactionManager: postgresTransactionManager(),
      });
    }

    return new MongoIXSuggestionsSampleQueryService({
      db: getConnection(),
      transactionManager: mongoTransactionManager(),
    });
  }
}

export { IXSuggestionsSampleQueryServiceFactory };
