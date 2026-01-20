import { FilesDataSourceFactory } from 'api/core/infrastructure/factories/FilesDataSourceFactory';
import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { FileStorageFactory } from 'api/core/infrastructure/files/FileStorageFactory';
import { MongoIdHandler } from 'api/core/infrastructure/mongodb/common/MongoIdGenerator';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';

import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { PXExtractParagraphsFromEntity } from '../application/PXExtractParagraphsFromEntity';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory';
import { PXExtractionServiceFactory } from './PXExtractionServiceFactory';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory';

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
