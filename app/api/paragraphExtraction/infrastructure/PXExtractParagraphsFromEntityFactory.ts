// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoIdG... Remove this comment to see the full error message
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/getConne... Remove this comment to see the full error message
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant.js';

import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../files.v2/database/data_sour... Remove this comment to see the full error message
import { DefaultFilesDataSource } from '../files.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../files.v2/infrastructure/Fil... Remove this comment to see the full error message
import { FileStorageStrategyFactory } from '../files.v2/infrastructure/FileStorageStrategyFactory.js';
// @ts-expect-error TS(2307): Cannot find module '../entities.v2/database/data_s... Remove this comment to see the full error message
import { DefaultEntitiesDataSource } from '../entities.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../log.v2/infrastructure/Stand... Remove this comment to see the full error message
import { DefaultLogger } from '../log.v2/infrastructure/StandardLogger.js';
// @ts-expect-error TS(2307): Cannot find module '../settings.v2/database/data_s... Remove this comment to see the full error message
import { DefaultSettingsDataSource } from '../settings.v2/database/data_source_defaults.js';

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
