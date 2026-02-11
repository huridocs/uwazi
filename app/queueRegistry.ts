/* eslint-disable max-lines */ /* eslint-disable max-statements */
/* eslint-disable max-classes-per-file */
import { ValidationError } from 'api/common.v2/validation/ValidationError';
import { PDFPostProcessJob } from 'api/core/application/PDFPostProcessJob';
import { TemplateUpdateDenormalizeEntitiesBatch } from 'api/core/application/TemplateUpdateDenormalizeEntitiesBatch';
import { BulkCleanupEntityUseCaseFactory } from 'api/core/infrastructure/factories/BulkCleanupEntityUseCaseFactory';
import { DenormalizeThesaurusEntitiesUseCaseFactory } from 'api/core/infrastructure/factories/DenormalizeThesaurusEntitiesUseCaseFactory';
import { FilesDataSourceFactory } from 'api/core/infrastructure/factories/FilesDataSourceFactory';
import { FilesServiceFactory } from 'api/core/infrastructure/factories/FilesServiceFactory';
import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { FileStorageFactory } from 'api/core/infrastructure/files/FileStorageFactory';
import { BulkCleanupEntityJob } from 'api/core/infrastructure/jobs/BulkCleanupEntityJob';
import { DeleteFileFromStorageJobHandler } from 'api/core/infrastructure/jobs/DeleteFileFromStorageJobHandler';
import { DenormalizeThesaurusEntitiesChunkHandler } from 'api/core/infrastructure/jobs/DenormalizeThesaurusEntitiesChunkHandler';
import { DenormalizeThesaurusEntitiesHandler } from 'api/core/infrastructure/jobs/DenormalizeThesaurusEntitiesHandler';
import { PDFPostProcessJobHandler } from 'api/core/infrastructure/jobs/PDFPostProcessJobHandler';
import { RelationshipSyncJob } from 'api/core/infrastructure/jobs/RelationshipSyncJob';
import { TemplatePostProcessEntitiesJob } from 'api/core/infrastructure/jobs/TemplatePostProcessEntitiesJob';
import { DenormalizeEntityUpdatedListener } from 'api/core/infrastructure/listeners/DenormalizeEntityUpdatedListener';
import { ProcessRelationshipAfterEntityUpdatedListener } from 'api/core/infrastructure/listeners/ProcessRelationshipAfterEntityUpdatedListener';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoRelationshipsV1DataSource } from 'api/core/infrastructure/mongodb/MongoRelationshipsV1DataSource';
import { PDFService } from 'api/core/infrastructure/services/PDFService';
import { V1WebSocketsWrapper } from 'api/core/infrastructure/services/V1WebSocketsWrapper';
import { applicationEventsBus } from 'api/core/libs/eventsbus';
import {
  Dispatchable,
  HeartbeatCallback,
} from 'api/core/libs/queue/application/contracts/Dispatchable';
import { DispatchableClass } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { CsvCreateThesauriValuesJobFactory } from 'api/csv.v2/infrastructure/factories/CsvCreateThesauriValuesJobFactory';
import { CsvExtractUploadedZipJobFactory } from 'api/csv.v2/infrastructure/factories/CsvExtractUploadedZipJobFactory';
import { CsvImportEntitiesJobFactory } from 'api/csv.v2/infrastructure/factories/CsvImportEntitiesJobFactory';
import { CsvPreflightJobFactory } from 'api/csv.v2/infrastructure/factories/CsvPreflightJobFactory';
import { CsvCreateRelationshipEntitiesJobFactory } from 'api/csv.v2/infrastructure/factories/CsvCreateRelationshipEntitiesJobFactory';
import { CSVImportEntitiesFactories } from 'api/csv.v2/infrastructure/factories/CSVImportEntitiesFactories';
import { CsvCreateThesauriValuesJobHandler } from 'api/csv.v2/infrastructure/jobHandlers/CsvCreateThesauriValuesJobHandler';
import { CsvImportEntitiesJobHandler } from 'api/csv.v2/infrastructure/jobHandlers/CsvImportEntitiesJobHandler';
import { CsvExtractUploadedZipJobHandler } from 'api/csv.v2/infrastructure/jobHandlers/CsvExtractUploadedZipJobHandler';
import { CsvPreflightJobHandler } from 'api/csv.v2/infrastructure/jobHandlers/CsvPreflightJobHandler';
import { CsvCreateRelationshipEntitiesJobHandler } from 'api/csv.v2/infrastructure/jobHandlers/CsvCreateRelationshipEntitiesJobHandler';
import { CsvV1CompatEmitter } from 'api/csv.v2/infrastructure/services/CsvV1CompatEmitter';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { denormalizeRelated } from 'api/entities/denormalize';
import { MongoPXEntitiesStatusDataSource } from 'api/paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource';
import { PXCreateEntityStatusesFactory } from 'api/paragraphExtraction/infrastructure/PXCreateEntityStatusesFactory';
import { PXCreateParagraphsFactory } from 'api/paragraphExtraction/infrastructure/PXCreateParagraphsFactory';
import { PXCreateParagraphsJob } from 'api/paragraphExtraction/infrastructure/PXCreateParagraphsJob';
import { PXExtractionServiceFactory } from 'api/paragraphExtraction/infrastructure/PXExtractionServiceFactory';
import { PXExtractorsQueryServiceFactory } from 'api/paragraphExtraction/infrastructure/PXExtractorsQueryServiceFactory';
import { PXExtractParagraphsFromEntityJob } from 'api/paragraphExtraction/infrastructure/PXExtractParagraphsFromEntityJob';
import { CreateParagraphExtractionEntityStatusesJob } from 'api/paragraphExtraction/jobs/CreateParagraphExtractionEntityStatusesJob';
import relationships from 'api/relationships';
import { InformationExtraction } from 'api/services/informationextraction/InformationExtraction';
import { IXTaskService } from 'api/services/informationextraction/TaskService';
import { TrainModelForPDF } from 'api/services/informationextraction/TrainModelForPDF';
import { TrainModelForText } from 'api/services/informationextraction/TrainModelForText';
import { IXTrainModelJob } from 'api/services/informationextraction/TrainModelJob';
import settings from 'api/settings';
import { AcceptSuggestionsFactory } from 'api/suggestions/infrastructure/AcceptSuggestionsFactory';
import { AcceptSuggestionsJob } from 'api/suggestions/jobs/AcceptSuggestionsJob';
import { CreateBlankStateSuggestionsJob } from 'api/suggestions/jobs/CreateBlankStateSuggestionsJob';
import { tenants } from 'api/tenants/tenantContext';

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
    const useCase = CsvExtractUploadedZipJobFactory.default();
    const sockets = new V1WebSocketsWrapper();
    const v1Compat = new CsvV1CompatEmitter({ sockets });
    return new CsvExtractUploadedZipJobHandler({ useCase, sockets, v1Compat });
  });

  register(CsvPreflightJobHandler, async () => {
    const useCase = CsvPreflightJobFactory.default();
    const sockets = new V1WebSocketsWrapper();
    const v1Compat = new CsvV1CompatEmitter({ sockets });
    return new CsvPreflightJobHandler({ useCase, sockets, v1Compat });
  });

  register(CsvCreateThesauriValuesJobHandler, async () => {
    const useCase = CsvCreateThesauriValuesJobFactory.default();
    const sockets = new V1WebSocketsWrapper();
    const v1Compat = new CsvV1CompatEmitter({ sockets });
    return new CsvCreateThesauriValuesJobHandler({ useCase, sockets, v1Compat });
  });

  register(CsvCreateRelationshipEntitiesJobHandler, async () => {
    const useCase = CsvCreateRelationshipEntitiesJobFactory.default();
    const sockets = new V1WebSocketsWrapper();
    const v1Compat = new CsvV1CompatEmitter({ sockets });
    return new CsvCreateRelationshipEntitiesJobHandler({ useCase, sockets, v1Compat });
  });

  register(CsvImportEntitiesJobHandler, async () => {
    const useCase = CsvImportEntitiesJobFactory.default();
    const sockets = new V1WebSocketsWrapper();
    const transactionManager = TransactionManagerFactory.default();
    const rowErrorsDS = CSVImportEntitiesFactories.CSVImportRowErrorsDSDefault(transactionManager);
    const v1Compat = new CsvV1CompatEmitter({ sockets, rowErrorsDS });
    return new CsvImportEntitiesJobHandler({ useCase, sockets, v1Compat });
  });

  register(
    BulkCleanupEntityJob,
    async () => new BulkCleanupEntityJob({ BulkCleanupEntityUseCaseFactory })
  );

  register(
    DeleteFileFromStorageJobHandler,
    async () => new DeleteFileFromStorageJobHandler({ fileStorage: FileStorageFactory.default() })
  );

  register(
    DenormalizeThesaurusEntitiesChunkHandler,
    async () =>
      new DenormalizeThesaurusEntitiesChunkHandler({ DenormalizeThesaurusEntitiesUseCaseFactory })
  );

  register(DenormalizeThesaurusEntitiesHandler, async () => {
    const transactionManager = TransactionManagerFactory.default();

    const entitiesDS = new MongoMultiLanguageEntityDataSource(getConnection(), transactionManager);
    const jobsDispatcher = DefaultDispatcher(tenants.current().name, transactionManager);

    return new DenormalizeThesaurusEntitiesHandler({ entitiesDS, jobsDispatcher });
  });

  register(
    DenormalizeEntityUpdatedListener.asJob(),
    async () =>
      new DenormalizeEntityUpdatedListener({
        denormalizeRelated,
        templatesDS: TemplatesDataSourceFactory.default(TransactionManagerFactory.default()),
      })
  );

  register(
    ProcessRelationshipAfterEntityUpdatedListener.asJob(),
    async () => new ProcessRelationshipAfterEntityUpdatedListener({})
  );
}
