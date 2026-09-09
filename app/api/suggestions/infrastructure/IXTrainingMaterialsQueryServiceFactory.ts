import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { IXTrainingMaterialsQueryService } from '../domain/IXTrainingMaterialsQueryService.js';
import { MongoIXTrainingMaterialsQueryService } from './MongoIXTrainingMaterialsQueryService.js';

/** Stage 6 adds the Postgres implementation here, behind the same port. */
class IXTrainingMaterialsQueryServiceFactory {
  static default(): IXTrainingMaterialsQueryService {
    return new MongoIXTrainingMaterialsQueryService({
      db: getConnection(),
      transactionManager: TransactionManagerFactory.default(),
    });
  }
}

export { IXTrainingMaterialsQueryServiceFactory };
