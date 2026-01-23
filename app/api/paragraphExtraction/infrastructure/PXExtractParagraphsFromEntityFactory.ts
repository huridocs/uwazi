import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';

import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';




import { MongoMultiLanguageEntityDataSource } from '#api/entities.v2/database/MongoMultiLanguageEntityDataSource.js';



import { PXExtractParagraphsFromEntity } from '#api/paragraphExtraction/application/PXExtractParagraphsFromEntity.js';
import { PXExtractionServiceFactory } from '#api/paragraphExtraction/infrastructure/PXExtractionServiceFactory.js';
import { PXEntitiesStatusDataSourceFactory } from '#api/paragraphExtraction/infrastructure/PXEntityStatusDataSourceFactory.js';
import { PXExtractorsDataSourceFactory } from '#api/paragraphExtraction/infrastructure/PXExtractorsDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';

export class PXExtractParagraphsFromEntityFactory {
  static createDefault(tenantName: string): PXExtractParagraphsFromEntity {
    const connection = getConnection();
    const mongoTransactionManager = TransactionManagerFactory.default();

    const extractParagraphsFromEntity = new PXExtractParagraphsFromEntity({
      entitiesDS: new MongoMultiLanguageEntityDataSource(connection, mongoTransactionManager),
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
