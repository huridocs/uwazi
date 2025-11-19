import { MongoIdHandler } from 'api/core/infrastructure/mongodb/common/MongoIdGenerator';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { FilesDataSourceFactory } from 'api/core/infrastructure/factories/FilesDataSourceFactory';
import { FileStorageFactory } from 'api/files.v2/infrastructure/FileStorageFactory';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';

import { PXExtractParagraphsFromEntity } from '../application/PXExtractParagraphsFromEntity';
import { PXExtractionServiceFactory } from './PXExtractionServiceFactory';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory';

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
