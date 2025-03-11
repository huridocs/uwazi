import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import { FileStorageStrategyFactory } from 'api/files.v2/infrastructure/FileStorageStrategyFactory';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { DefaultLogger } from 'api/log.v2/infrastructure/StandardLogger';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';

import { MongoPXExtractorsDataSource } from './MongoPXExtractorsDataSource';
import { PXExtractParagraphsFromEntities } from '../application/PXExtractParagraphFromEntities';
import { PXExtractParagraphsFromEntity } from '../application/PXExtractParagraphsFromEntity';
import { MongoPXExtractionsDataSource } from './MongoPXExtractionsDataSource';
import { PXExtractionServiceFactory } from './PXExtractionServiceFactory';

export class PXExtractParagraphsFromEntitiesFactory {
  static createDefault(tenantName: string) {
    const db = getConnection();
    const transactionManager = DefaultTransactionManager();

    const extractParagraphsFromEntity = new PXExtractParagraphsFromEntity({
      entityDS: DefaultEntitiesDataSource(transactionManager),
      extractionsDS: new MongoPXExtractionsDataSource(db, transactionManager),
      extractionService: PXExtractionServiceFactory.createDefault(),
      extractorsDS: new MongoPXExtractorsDataSource(db, transactionManager),
      filesDS: DefaultFilesDataSource(transactionManager),
      fileStorage: FileStorageStrategyFactory.createDefault(),
      idGenerator: MongoIdHandler,
      settingsDS: DefaultSettingsDataSource(transactionManager),
      logger: DefaultLogger(),
      tenantName,
    });

    const extractionsDS = new MongoPXExtractionsDataSource(db, transactionManager);

    return new PXExtractParagraphsFromEntities({
      extractParagraphsFromEntity,
      extractionsDS,
    });
  }
}
