import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { SegmentationDirectoryFactory } from '#segmentation';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

import { tenants } from '#api/tenants/index.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { EntitiesServiceFactory } from '#api/core/infrastructure/factories/EntitiesServiceFactory.js';
import { EntitiesDataSourceFactory } from '#api/core/infrastructure/factories/EntitiesDataSourceFactory.js';
import { PXExtractParagraphsFromEntity } from '../application/PXExtractParagraphsFromEntity.js';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory.js';
import { PXExtractionServiceFactory } from './PXExtractionServiceFactory.js';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory.js';
import { User } from '#api/users.v2/model/User.js';

export class PXExtractParagraphsFromEntityFactory {
  static createDefault(tenantName: string): PXExtractParagraphsFromEntity {
    const connection = getConnection();
    const transactionManager = ExecutionContext.getStore()
      ? ExecutionContext.transactionManager
      : TransactionManagerFactory.default();

    const entitiesDS = EntitiesDataSourceFactory.default({
      transactionManager,
    });

    const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager: transactionManager,
    });

    const extractionService = PXExtractionServiceFactory.createDefault();

    const extractorsDS = PXExtractorsDataSourceFactory.createDefault({
      connection,
      mongoTransactionManager: transactionManager,
    });
    const filesDS = FilesDataSourceFactory.default();
    const settingsDS = SettingsDataSourceFactory.default({
      transactionManager,
    });
    const fileStorage = FileStorageFactory.default();
    const idGenerator = MongoIdHandler;
    const logger = LoggerFactory.default();
    const segmentationDirectory = SegmentationDirectoryFactory.default();

    const entitiesService = EntitiesServiceFactory.default({
      entitiesDS,
      settingsDS,
      transactionManager,
    });

    const extractParagraphsFromEntity = new PXExtractParagraphsFromEntity(
      {
        transactionManager,
        entitiesService,
        entitiesDS,
        entitiesStatusDS,
        extractionService,
        extractorsDS,
        filesDS,
        settingsDS,
        fileStorage,
        idGenerator,
        logger,
        tenantName,
        segmentationDirectory,
      },
      { tenant: tenants.current(), actor: User.createFrom(permissionsContext.getUserInContext()!) }
    );

    return extractParagraphsFromEntity;
  }
}
