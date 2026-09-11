import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { mongoTransactionManager } from '#api/services/informationextraction/infrastructure/contextTransactionManagers.js';
import { IXTrainingMaterialsQueryService } from '../domain/IXTrainingMaterialsQueryService.js';
import { MongoIXTrainingMaterialsQueryService } from './MongoIXTrainingMaterialsQueryService.js';

/** Stage 6 adds the Postgres implementation here, behind the same port. */
class IXTrainingMaterialsQueryServiceFactory {
  static default(): IXTrainingMaterialsQueryService {
    return new MongoIXTrainingMaterialsQueryService({
      db: getConnection(),
      transactionManager: mongoTransactionManager(),
    });
  }
}

export { IXTrainingMaterialsQueryServiceFactory };
