import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { HttpClientFactory } from 'api/common.v2/infrastructure/HttpClientFactory';
import { config } from 'api/config';
import { MongoEntitiesDataSource } from 'api/entities.v2/database/MongoEntitiesDataSource';
import { MongoFilesDataSource } from 'api/files.v2/database/MongoFilesDataSource';
import { FileSystemStorage } from 'api/files.v2/infrastructure/FileSystemStorage';
import { PathManager } from 'api/files.v2/infrastructure/PathManager';
import { DB } from 'api/odm';
import { MongoSettingsDataSource } from 'api/settings.v2/database/MongoSettingsDataSource';
import { MongoTemplatesDataSource } from 'api/templates.v2/database/MongoTemplatesDataSource';
import { PXCreateExtractor } from '../application/PXCreateExtractor';
import { PXExtractParagraphsFromEntity } from '../application/PXExtractParagraphsFromEntity';
import { PXExternalExtractionService } from '../infrastructure/ExternalExtractionService/ExternalExtractionService';
import { MongoPXExtractorsDataSource } from '../infrastructure/MongoPXExtractorsDataSource';
import { tenants } from 'api/tenants';

(async () => {
  await DB.connect(config.DBHOST, {});

  await tenants.run(async () => {
    const transactionManager = DefaultTransactionManager();

    const createExtractorUseCase = new PXCreateExtractor({
      templatesDS: new MongoTemplatesDataSource(getConnection(), transactionManager),
      extractorDS: new MongoPXExtractorsDataSource(getConnection(), transactionManager),
      idGenerator: MongoIdHandler,
    });

    const extractor = await createExtractorUseCase.execute({
      sourceTemplateId: '5bfbb1a0471dd0fc16ada146',
      targetTemplateId: '67b72d9c8f9ad3b0824d4418',
    });

    const extractParagraphsUseCase = new PXExtractParagraphsFromEntity({
      extractorsDS: new MongoPXExtractorsDataSource(getConnection(), transactionManager),
      entityDS: new MongoEntitiesDataSource(
        getConnection(),
        new MongoTemplatesDataSource(getConnection(), transactionManager),
        new MongoSettingsDataSource(getConnection(), transactionManager),
        transactionManager
      ),
      filesDS: new MongoFilesDataSource(getConnection(), transactionManager),
      settingsDS: new MongoSettingsDataSource(getConnection(), transactionManager),
      extractionService: new PXExternalExtractionService({
        url: 'http://localhost:5056',
        httpClient: HttpClientFactory.createDefault(),
      }),
      fileStorage: new FileSystemStorage(new PathManager({ tenant: tenants.current() })),
    });

    await extractParagraphsUseCase.execute({
      extractorId: extractor.id,
      entitySharedId: 'hceype04ae7',
      tenantName: 'default',
      userId: '58ad7d240d44252fee4e6212',
    });
  }, 'default');
  await DB.disconnect();
})();
