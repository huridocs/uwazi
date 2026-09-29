import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { isPostgresCoreActive } from '#api/core/libs/featureFlags.js';
import {
  mongoTransactionManager,
  postgresTransactionManager,
} from '#api/services/informationextraction/infrastructure/contextTransactionManagers.js';
import { IXSuggestionsStateQueryService } from '../domain/IXSuggestionsStateQueryService.js';
import { MongoIXSuggestionsStateQueryService } from './MongoIXSuggestionsStateQueryService.js';
import { PostgresIXSuggestionsStateQueryService } from './PostgresIXSuggestionsStateQueryService.js';

class IXSuggestionsStateQueryServiceFactory {
  static default(): IXSuggestionsStateQueryService {
    if (isPostgresCoreActive()) {
      return new PostgresIXSuggestionsStateQueryService({
        tenantId: ExecutionContext.currentTenant.name,
        pgTransactionManager: postgresTransactionManager(),
      });
    }

    return new MongoIXSuggestionsStateQueryService({
      db: getConnection(),
      transactionManager: mongoTransactionManager(),
    });
  }
}

export { IXSuggestionsStateQueryServiceFactory };
