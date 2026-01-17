/* eslint-disable max-lines */ /* eslint-disable max-statements */
/* eslint-disable max-classes-per-file */
import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';
import { getConnection } from '#api/common.v2/database/getConnectionForCurrentTenant.js';
import { ValidationError } from '#api/common.v2/validation/ValidationError.js';
import { TemplateUpdateDenormalizeEntitiesBatch } from '#api/core/application/TemplateUpdateDenormalizeEntitiesBatch.js';
import { TemplatePostProcessEntitiesJob } from '#api/core/infrastructure/jobs/TemplatePostProcessEntitiesJob.js';
import { MongoMultiLanguageEntityDataSource } from '#api/entities.v2/database/MongoMultiLanguageEntityDataSource.js';
import { MongoPXEntitiesStatusDataSource } from '#api/paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource.js';
import { PXCreateEntityStatusesFactory } from '#api/paragraphExtraction/infrastructure/PXCreateEntityStatusesFactory.js';
import { PXCreateParagraphsFactory } from '#api/paragraphExtraction/infrastructure/PXCreateParagraphsFactory.js';
import { PXCreateParagraphsJob } from '#api/paragraphExtraction/infrastructure/PXCreateParagraphsJob.js';
import { PXExtractionServiceFactory } from '#api/paragraphExtraction/infrastructure/PXExtractionServiceFactory.js';
import { PXExtractorsQueryServiceFactory } from '#api/paragraphExtraction/infrastructure/PXExtractorsQueryServiceFactory.js';
import { PXExtractParagraphsFromEntityJob } from '#api/paragraphExtraction/infrastructure/PXExtractParagraphsFromEntityJob.js';
import {
  Dispatchable,
  HeartbeatCallback,
} from '#api/queue.v2/application/contracts/Dispatchable.js';
import { DispatchableClass } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { MongoRelationshipsV1DataSource } from '#api/relationships/MongoRelationshipsV1DataSource.js';
import { InformationExtraction } from '#api/services/informationextraction/InformationExtraction.js';
import { IXTaskService } from '#api/services/informationextraction/TaskService.js';
import { TrainModelForPDF } from '#api/services/informationextraction/TrainModelForPDF.js';
import { TrainModelForText } from '#api/services/informationextraction/TrainModelForText.js';
import { IXTrainModelJob } from '#api/services/informationextraction/TrainModelJob.js';
import { DefaultSettingsDataSource } from '#api/settings.v2/database/data_source_defaults.js';
import { AcceptSuggestionsJob } from '#api/suggestions/jobs/AcceptSuggestionsJob.js';
import { AcceptSuggestionsFactory } from '#api/suggestions/infrastructure/AcceptSuggestionsFactory.js';
import { CreateBlankStateSuggestionsJob } from '#api/suggestions/jobs/CreateBlankStateSuggestionsJob.js';
import { DefaultTemplatesDataSource } from '#api/templates.v2/database/data_source_defaults.js';
import { CreateParagraphExtractionEntityStatusesJob } from '#api/paragraphExtraction/jobs/CreateParagraphExtractionEntityStatusesJob';
import { DefaultDispatcher } from '#api/queue.v2/configuration/factories';
import settings from '#api/settings/settings.js';

function randomIntFromInterval(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export class TestJob implements Dispatchable {
  static BATCH_SIZE = 200;

  // eslint-disable-next-line class-methods-use-this
  async handleDispatch(_heartbeat: HeartbeatCallback) {
    await new Promise((resolve, reject) => {
      setTimeout(
        () => {
          if (Math.floor(Math.random() * 5) === 0) {
            reject(
              new ValidationError([
                {
                  path: '/',
                  message: 'Random validation error occurred',
                },
              ])
            );
          }
          if (Math.floor(Math.random() * 5) === 0) {
            reject(new Error('Random error occurred'));
          }
          resolve({});
        },
        randomIntFromInterval(0, 1500)
      );
    });
  }
}

// eslint-disable-next-line max-statements
export function registerJobs(
  register: <T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    factory: (namespace: string) => Promise<T>
  ) => void
) {
  register(TestJob, async () => new TestJob());

  register(CreateBlankStateSuggestionsJob, async () => new CreateBlankStateSuggestionsJob());

  register(PXExtractParagraphsFromEntityJob, async () => new PXExtractParagraphsFromEntityJob());

  register(PXCreateParagraphsJob, async () => {
    const transactionManager = TransactionManagerFactory.default();
    const connection = getConnection();
    const extractorsQueryService = PXExtractorsQueryServiceFactory.createDefault({
      connection,
      transactionManager,
    });
    const settingsDS = SettingsDataSourceFactory.default(transactionManager);

    return new PXCreateParagraphsJob({
      extractionService: PXExtractionServiceFactory.createDefault(),
      useCase: PXCreateParagraphsFactory.createDefault(),
      pxEntitiesStatusDS: new MongoPXEntitiesStatusDataSource(
        connection,
        transactionManager,
        settingsDS,
        extractorsQueryService
      ),
    });
  });

  register(CreateParagraphExtractionEntityStatusesJob, async (namespace: string) => {
    const batchSize = 50;
    const useCase = PXCreateEntityStatusesFactory.createDefault({
      batchSize,
    });
    const dispatcher = DefaultDispatcher(namespace, TransactionManagerFactory.default(), {
      lockWindow: 1000 * 60,
    });

    return new CreateParagraphExtractionEntityStatusesJob(
      {
        createEntityStatusesUseCase: useCase,
        dispatcher,
      },
      batchSize
    );
  });

  const informationExtraction = new InformationExtraction();
  register(IXTrainModelJob, async (tenantName: string) => {
    const settingsValues = await settings.get();
    const serviceUrl = settingsValues.features?.metadataExtraction?.url;
    const iXTaskService = new IXTaskService({
      tenantName,
      taskManager: informationExtraction.taskManager,
    });

    if (!serviceUrl) {
      throw new Error('Metadata extraction service URL is not configured.');
    }

    return new IXTrainModelJob({
      tenantName,
      trainModelForPDF: new TrainModelForPDF({
        tenantName,
        serviceUrl,
        iXTaskService,
      }),
      trainModelForText: new TrainModelForText({
        iXTaskService,
        tenantName,
        serviceUrl,
      }),
    });
  });

  register(PDFPostProcessJobHandler, async (_tenantName: string) => {
    const transactionManager = TransactionManagerFactory.default();
    return new PDFPostProcessJobHandler({
      useCase: new PDFPostProcessJob({
        eventBus: applicationEventsBus,
        transactionManager,
        filesDS: FilesDataSourceFactory.default(transactionManager),
        fileStorage: FileStorageFactory.default(),
        pdfService: new PDFService(),
        idGenerator: IdGeneratorFactory.default(),
        filesService: FilesServiceFactory.default(transactionManager),
      }),
      wSockets: new V1WebSocketsWrapper(),
    });
  });

  register(AcceptSuggestionsJob, async (tenantName: string) => {
    const { job } = await AcceptSuggestionsFactory.createDefault({
      tenantName,
    });
    return job;
  });

  register(TemplatePostProcessEntitiesJob, async () => {
    const transactionManager = TransactionManagerFactory.default();

    return new TemplatePostProcessEntitiesJob({
      templatesDS: TemplatesDataSourceFactory.default(transactionManager),
      useCase: new TemplateUpdateDenormalizeEntitiesBatch({
        entitiesDS: new MongoMultiLanguageEntityDataSource(getConnection(), transactionManager),
        filesDS: FilesDataSourceFactory.default(transactionManager),
        relationshipsV1DS: new MongoRelationshipsV1DataSource(getConnection(), transactionManager),
        templatesDS: TemplatesDataSourceFactory.default(transactionManager),
        transactionManager,
      }),
    });
  });

  register(
    RelationshipSyncJob,
    async () =>
      new RelationshipSyncJob({
        relationships,
      })
  );

  register(CsvExtractUploadedZipJobHandler, async () => {
    const transactionManager = TransactionManagerFactory.default();
    const csvImportsDS = CSVImportEntitiesFactories.CSVImportDSDefault(transactionManager);
    const rowsDS = CSVImportEntitiesFactories.CSVImportRowsDSDefault(transactionManager);
    const tenant = tenants.current();
    const fileStorage = new FileSystemStorage(new PathManager({ tenant }));
    const fileNormalizer = new CsvImportFileNormalizer({
      fileStorage,
      filesIO: new FileContentsIO(),
    });
    const rowsStager = new CsvImportRowsStager({ fileStorage });
    const jobsDispatcher = DefaultDispatcher(tenant.name, transactionManager);
    const useCase = new CsvExtractUploadedZipJob({
      csvImportsDS,
      fileNormalizer,
      rowsStager,
      rowsDS,
      transactionManager,
      jobsDispatcher,
    });
    const sockets = new V1WebSocketsWrapper();
    return new CsvExtractUploadedZipJobHandler({ useCase, sockets });
  });

  register(CsvPreflightJobHandler, async () => {
    const transactionManager = TransactionManagerFactory.default();
    const csvImportsDS = CSVImportEntitiesFactories.CSVImportDSDefault(transactionManager);
    const rowsDS = CSVImportEntitiesFactories.CSVImportRowsDSDefault(transactionManager);
    const templatesDS = TemplatesDataSourceFactory.default(transactionManager);
    const settingsDS = SettingsDataSourceFactory.default(transactionManager);
    const thesauriDS = new MongoThesauriDataSource(getConnection(), transactionManager);
    const thesauriValuesDS =
      CSVImportEntitiesFactories.CSVImportThesauriValuesDSDefault(transactionManager);
    const tenant = tenants.current();
    const jobsDispatcher = DefaultDispatcher(tenant.name, transactionManager);
    const useCase = new CsvPreflightJob({
      csvImportsDS,
      rowsDS,
      templatesDS,
      settingsDS,
      thesauriDS,
      thesauriValuesDS,
      jobsDispatcher,
      transactionManager,
    });
    const sockets = new V1WebSocketsWrapper();
    return new CsvPreflightJobHandler({ useCase, sockets });
  });

  register(CsvCreateThesauriValuesJobHandler, async () => {
    const transactionManager = TransactionManagerFactory.default();
    const csvImportsDS = CSVImportEntitiesFactories.CSVImportDSDefault(transactionManager);
    const thesauriValuesDS =
      CSVImportEntitiesFactories.CSVImportThesauriValuesDSDefault(transactionManager);
    const useCase = new CsvCreateThesauriValuesJob({
      csvImportsDS,
      thesauriValuesDS,
      thesauriRepo: new LegacyThesauriRepository(),
      translationsRepo: new LegacyTranslationsRepository(),
      transactionManager,
    });
    const sockets = new V1WebSocketsWrapper();
    return new CsvCreateThesauriValuesJobHandler({ useCase, sockets });
  });

  register(
    BulkCleanupEntityJob,
    async () => new BulkCleanupEntityJob({ BulkCleanupEntityUseCaseFactory })
  );

  register(
    DeleteFileFromStorageJobHandler,
    async () => new DeleteFileFromStorageJobHandler({ fileStorage: FileStorageFactory.default() })
  );
}
