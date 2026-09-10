import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { IXSuggestionsStatsQueryService } from '../domain/IXSuggestionsStatsQueryService.js';
import { MongoIXSuggestionsStatsQueryService } from './MongoIXSuggestionsStatsQueryService.js';

/**
 * Stage 6 adds the Postgres implementation here, behind the same port, the way
 * `IXSuggestionsDAOFactory` will.
 */
class IXSuggestionsStatsQueryServiceFactory {
  static default(): IXSuggestionsStatsQueryService {
    return new MongoIXSuggestionsStatsQueryService({
      db: getConnection(),
      transactionManager: TransactionManagerFactory.mongo(),
    });
  }
}

export { IXSuggestionsStatsQueryServiceFactory };
