import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { mongoTransactionManager } from '#api/services/informationextraction/infrastructure/contextTransactionManagers.js';
import { IXSuggestionsStatsQueryService } from '../domain/IXSuggestionsStatsQueryService.js';
import { MongoIXSuggestionsStatsQueryService } from './MongoIXSuggestionsStatsQueryService.js';

/** Stage 6 adds the Postgres implementation here, behind the same port. */
class IXSuggestionsStatsQueryServiceFactory {
  static default(): IXSuggestionsStatsQueryService {
    return new MongoIXSuggestionsStatsQueryService({
      db: getConnection(),
      transactionManager: mongoTransactionManager(),
    });
  }
}

export { IXSuggestionsStatsQueryServiceFactory };
