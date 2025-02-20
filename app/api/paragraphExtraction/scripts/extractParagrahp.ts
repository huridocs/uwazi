/* eslint-disable @typescript-eslint/no-floating-promises */
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
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { SystemLogger } from 'api/log.v2/infrastructure/StandardLogger';

(async () => {
  await DB.connect(config.DBHOST, {});

  await tenants.run(async () => {
    const transactionManager = new MongoTransactionManager(
      DB.connectionForDB('uwazi_development').getClient(),
      SystemLogger()
    );

    const createExtractorUseCase = new PXCreateExtractor({
      templatesDS: new MongoTemplatesDataSource(
        DB.mongodb_Db('uwazi_development'),
        transactionManager
      ),
      extractorDS: new MongoPXExtractorsDataSource(
        DB.mongodb_Db('uwazi_development'),
        transactionManager
      ),
      idGenerator: MongoIdHandler,
    });

    const extractor = await createExtractorUseCase.execute({
      sourceTemplateId: '67b768af4aeb5031fc97daf0',
      targetTemplateId: '67b768bf4aeb5031fc97db5c',
    });

    const extractParagraphsUseCase = new PXExtractParagraphsFromEntity({
      extractorsDS: new MongoPXExtractorsDataSource(
        DB.mongodb_Db('uwazi_development'),
        transactionManager
      ),
      entityDS: new MongoEntitiesDataSource(
        DB.mongodb_Db('uwazi_development'),
        new MongoTemplatesDataSource(DB.mongodb_Db('uwazi_development'), transactionManager),
        new MongoSettingsDataSource(DB.mongodb_Db('uwazi_development'), transactionManager),
        transactionManager
      ),
      filesDS: new MongoFilesDataSource(DB.mongodb_Db('uwazi_development'), transactionManager),
      settingsDS: new MongoSettingsDataSource(
        DB.mongodb_Db('uwazi_development'),
        transactionManager
      ),
      extractionService: new PXExternalExtractionService({
        url: 'http://localhost:5056',
        httpClient: HttpClientFactory.createDefault(),
      }),
      fileStorage: new FileSystemStorage(new PathManager({ tenant: tenants.current() })),
    });

    await extractParagraphsUseCase.execute({
      extractorId: extractor.id,
      entitySharedId: 'kzpjfmdteb',
      tenantName: 'default',
      userId: '58ad7d240d44252fee4e6212',
    });
  }, 'default');
  await DB.disconnect();
})();
