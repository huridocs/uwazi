import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';

import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';

import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';

import { DefaultFilesDataSource } from '#api/files.v2/database/data_source_defaults.js';

import { FileStorageStrategyFactory } from '#api/files.v2/infrastructure/FileStorageStrategyFactory.js';

import { DefaultEntitiesDataSource } from '#api/entities.v2/database/data_source_defaults.js';

import { DefaultLogger } from '#api/core/libs/logger/infrastructure/StandardLogger.js';

import { DefaultSettingsDataSource } from '#api/settings.v2/database/data_source_defaults.js';

import { PXExtractParagraphsFromEntity } from '#api/paragraphExtraction/application/PXExtractParagraphsFromEntity.js';
import { PXExtractionServiceFactory } from '#api/paragraphExtraction/infrastructure/PXExtractionServiceFactory.js';
import { PXEntitiesStatusDataSourceFactory } from '#api/paragraphExtraction/infrastructure/PXEntityStatusDataSourceFactory.js';
import { PXExtractorsDataSourceFactory } from '#api/paragraphExtraction/infrastructure/PXExtractorsDataSourceFactory.js';

export class PXExtractParagraphsFromEntityFactory {
  static createDefault(tenantName: string): PXExtractParagraphsFromEntity {
    const connection = getConnection();
    const mongoTransactionManager = TransactionManagerFactory.default();

    const extractParagraphsFromEntity = new PXExtractParagraphsFromEntity({
      entityDS: DefaultEntitiesDataSource(mongoTransactionManager),
      entitiesStatusDS: PXEntitiesStatusDataSourceFactory.createDefault({
        connection,
        mongoTransactionManager,
      }),
      extractionService: PXExtractionServiceFactory.createDefault(),
      extractorsDS: PXExtractorsDataSourceFactory.createDefault({
        connection,
        mongoTransactionManager,
      }),
      filesDS: FilesDataSourceFactory.default(mongoTransactionManager),
      fileStorage: FileStorageFactory.default(),
      idGenerator: MongoIdHandler,
      settingsDS: SettingsDataSourceFactory.default(mongoTransactionManager),
      logger: LoggerFactory.default(),
      tenantName,
    });

    return extractParagraphsFromEntity;
  }
}
