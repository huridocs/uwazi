import { MongoIdHandler } from '#api/common.v2/database/MongoIdGenerator.js';

import { getConnection } from '#api/common.v2/database/getConnectionForCurrentTenant.js';

import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';

import { DefaultFilesDataSource } from '../files.v2/database/data_source_defaults.js';

import { FileStorageStrategyFactory } from '../files.v2/infrastructure/FileStorageStrategyFactory.js';

import { DefaultEntitiesDataSource } from '#api/entities.v2/database/data_source_defaults.js';

import { DefaultLogger } from '#api/log.v2/infrastructure/StandardLogger.js';

import { DefaultSettingsDataSource } from '#api/settings.v2/database/data_source_defaults.js';

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
      settingsDS: DefaultSettingsDataSource(mongoTransactionManager),
      logger: DefaultLogger(),
      tenantName,
    });

    return extractParagraphsFromEntity;
  }
}
