import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { HttpClientFactory } from 'api/common.v2/infrastructure/HttpClientFactory';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import { FileStorageStrategyFactory } from 'api/files.v2/infrastructure/FileStorageStrategyFactory';
import { DefaultEntitiesDataSource } from 'api/entities.v2/database/data_source_defaults';
import { config } from 'api/config';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';

import { MongoPXExtractorsDataSource } from './MongoPXExtractorsDataSource';
import { PXExtractParagraphsFromEntities } from '../application/PXExtractParagraphFromEntities';
import { PXExtractParagraphsFromEntity } from '../application/PXExtractParagraphsFromEntity';
import { MongoPXExtractionsDataSource } from './MongoPXExtractionsDataSource';
import { PXExternalExtractionService } from './ExternalExtractionService/ExternalExtractionService';

export class PXExtractParagraphsFromEntitiesFactory {
  static createDefault() {
    const db = getConnection();
    const transactionManager = DefaultTransactionManager();

    const extractParagraphsFromEntity = new PXExtractParagraphsFromEntity({
      entityDS: DefaultEntitiesDataSource(transactionManager),
      extractionsDS: new MongoPXExtractionsDataSource(db, transactionManager),
      extractionService: new PXExternalExtractionService({
        url: config.externalServicesUrls.paragraphExtraction,
        httpClient: HttpClientFactory.createDefault(),
      }),
      extractorsDS: new MongoPXExtractorsDataSource(db, transactionManager),
      filesDS: DefaultFilesDataSource(transactionManager),
      fileStorage: FileStorageStrategyFactory.createDefault(),
      idGenerator: MongoIdHandler,
      settingsDS: DefaultSettingsDataSource(transactionManager),
    });

    return new PXExtractParagraphsFromEntities({
      extractParagraphsFromEntity,
    });
  }
}
