import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SegmentationDirectoryFactory } from '#segmentation';
import { isPostgresCoreActive } from '#api/core/libs/featureFlags.js';
import {
  mongoTransactionManager,
  postgresTransactionManager,
} from '#api/services/informationextraction/infrastructure/contextTransactionManagers.js';
import { IXTrainingMaterialsQueryService } from '../domain/IXTrainingMaterialsQueryService.js';
import { MongoIXTrainingMaterialsQueryService } from './MongoIXTrainingMaterialsQueryService.js';
import { PostgresIXTrainingMaterialsQueryService } from './PostgresIXTrainingMaterialsQueryService.js';

class IXTrainingMaterialsQueryServiceFactory {
  static default(): IXTrainingMaterialsQueryService {
    if (isPostgresCoreActive()) {
      return new PostgresIXTrainingMaterialsQueryService({
        tenantId: ExecutionContext.currentTenant.name,
        pgTransactionManager: postgresTransactionManager(),
        segmentationDirectory: SegmentationDirectoryFactory.default(),
      });
    }

    return new MongoIXTrainingMaterialsQueryService({
      db: getConnection(),
      transactionManager: mongoTransactionManager(),
      segmentationDirectory: SegmentationDirectoryFactory.default(),
    });
  }
}

export { IXTrainingMaterialsQueryServiceFactory };
