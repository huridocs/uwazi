import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import { FileStorageStrategyFactory } from 'api/files.v2/infrastructure/FileStorageStrategyFactory';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { DefaultLogger } from 'api/log.v2/infrastructure/StandardLogger';
import { MongoSettingsDataSourceFactory } from 'api/core/infrastructure/factories/MongoSettingsDataSource';

import { PXExtractParagraphsFromEntity } from '../application/PXExtractParagraphsFromEntity';
import { PXExtractionServiceFactory } from './PXExtractionServiceFactory';
import { PXEntitiesStatusDataSourceFactory } from './PXEntityStatusDataSourceFactory';
import { PXExtractorsDataSourceFactory } from './PXExtractorsDataSourceFactory';

export class PXExtractParagraphsFromEntityFactory {
  static createDefault(tenantName: string): PXExtractParagraphsFromEntity {
    const connection = getConnection();
    const mongoTransactionManager = DefaultTransactionManager();

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
      filesDS: DefaultFilesDataSource(mongoTransactionManager),
      fileStorage: FileStorageStrategyFactory.createDefault(),
      idGenerator: MongoIdHandler,
      settingsDS: MongoSettingsDataSourceFactory.default(mongoTransactionManager),
      logger: DefaultLogger(),
      tenantName,
    });

    return extractParagraphsFromEntity;
  }
}
