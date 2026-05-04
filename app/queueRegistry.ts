/* eslint-disable max-lines */ /* eslint-disable max-statements */

import { ValidationError } from '#api/common.v2/validation/ValidationError.js';
import { TemplateUpdateDenormalizeEntitiesBatch } from '#api/core/application/TemplateUpdateDenormalizeEntitiesBatch.js';
import { BulkCleanupEntityUseCaseFactory } from '#api/core/infrastructure/factories/BulkCleanupEntityUseCaseFactory.js';
import { DenormalizeThesaurusEntitiesUseCaseFactory } from '#api/core/infrastructure/factories/DenormalizeThesaurusEntitiesUseCaseFactory.js';
import { EntitiesDataSourceFactory } from '#api/core/infrastructure/factories/EntitiesDataSourceFactory.js';
import { EntityPreviewBatchHandlerFactory } from '#api/core/infrastructure/factories/EntityPreviewBatchFactory.js';
import { CloneLanguageEntitiesJobFactory } from '#api/core/infrastructure/factories/CloneLanguageEntitiesJobFactory.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { PDFPostProcessJobFactory } from '#api/core/infrastructure/factories/PDFPostProcessJobFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { BulkCleanupEntityJob } from '#api/core/infrastructure/jobs/BulkCleanupEntityJob.js';
import { DeleteFileFromStorageJobHandler } from '#api/core/infrastructure/jobs/DeleteFileFromStorageJobHandler.js';
import { DenormalizeThesaurusEntitiesChunkHandler } from '#api/core/infrastructure/jobs/DenormalizeThesaurusEntitiesChunkHandler.js';
import { DenormalizeThesaurusEntitiesHandler } from '#api/core/infrastructure/jobs/DenormalizeThesaurusEntitiesHandler.js';
import { EntityPreviewBatchHandler } from '#api/core/infrastructure/jobs/EntityPreviewBatchHandler.js';
import { CloneLanguageEntitiesJob } from '#api/core/infrastructure/jobs/CloneLanguageEntitiesJob.js';
import { PDFPostProcessJobHandler } from '#api/core/infrastructure/jobs/PDFPostProcessJobHandler.js';
import { RelationshipSyncJob } from '#api/core/infrastructure/jobs/RelationshipSyncJob.js';
import { TemplatePostProcessEntitiesJob } from '#api/core/infrastructure/jobs/TemplatePostProcessEntitiesJob.js';
import { DenormalizeEntityUpdatedListener } from '#api/core/infrastructure/listeners/DenormalizeEntityUpdatedListener.js';
import { ProcessRelationshipAfterEntityUpdatedListener } from '#api/core/infrastructure/listeners/ProcessRelationshipAfterEntityUpdatedListener.js';
import { AddLanguageListener } from '#api/core/infrastructure/listeners/AddLanguageListener.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoRelationshipsV1DataSource } from '#api/core/infrastructure/mongodb/MongoRelationshipsV1DataSource.js';
import { V1WebSocketsWrapper } from '#api/core/infrastructure/services/V1WebSocketsWrapper.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import {
  Dispatchable,
  HeartbeatCallback,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { DispatchableClass } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { CsvCleanupImportFilesJobFactory } from '#api/csv.v2/infrastructure/factories/CsvCleanupImportFilesJobFactory.js';
import { CsvCreateRelationshipEntitiesJobFactory } from '#api/csv.v2/infrastructure/factories/CsvCreateRelationshipEntitiesJobFactory.js';
import { CsvCreateThesauriValuesJobFactory } from '#api/csv.v2/infrastructure/factories/CsvCreateThesauriValuesJobFactory.js';
import { CsvExtractUploadedZipJobFactory } from '#api/csv.v2/infrastructure/factories/CsvExtractUploadedZipJobFactory.js';
import { CsvImportEntitiesJobFactory } from '#api/csv.v2/infrastructure/factories/CsvImportEntitiesJobFactory.js';
import { CsvPreflightJobFactory } from '#api/csv.v2/infrastructure/factories/CsvPreflightJobFactory.js';
import { CsvCleanupImportFilesJobHandler } from '#api/csv.v2/infrastructure/jobHandlers/CsvCleanupImportFilesJobHandler.js';
import { CsvCreateRelationshipEntitiesJobHandler } from '#api/csv.v2/infrastructure/jobHandlers/CsvCreateRelationshipEntitiesJobHandler.js';
import { CsvCreateThesauriValuesJobHandler } from '#api/csv.v2/infrastructure/jobHandlers/CsvCreateThesauriValuesJobHandler.js';
import { CsvExtractUploadedZipJobHandler } from '#api/csv.v2/infrastructure/jobHandlers/CsvExtractUploadedZipJobHandler.js';
import { CsvImportEntitiesJobHandler } from '#api/csv.v2/infrastructure/jobHandlers/CsvImportEntitiesJobHandler.js';
import { CsvPreflightJobHandler } from '#api/csv.v2/infrastructure/jobHandlers/CsvPreflightJobHandler.js';
import { denormalizeRelated } from '#api/entities/denormalize.js';
import { MongoPXEntitiesStatusDataSource } from '#api/paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource.js';
import { PXCreateEntityStatusesFactory } from '#api/paragraphExtraction/infrastructure/PXCreateEntityStatusesFactory.js';
import { PXCreateParagraphsFactory } from '#api/paragraphExtraction/infrastructure/PXCreateParagraphsFactory.js';
import { PXCreateParagraphsJob } from '#api/paragraphExtraction/infrastructure/PXCreateParagraphsJob.js';
import { PXExtractionServiceFactory } from '#api/paragraphExtraction/infrastructure/PXExtractionServiceFactory.js';
import { PXExtractorsQueryServiceFactory } from '#api/paragraphExtraction/infrastructure/PXExtractorsQueryServiceFactory.js';
import { PXExtractParagraphsFromEntityJob } from '#api/paragraphExtraction/infrastructure/PXExtractParagraphsFromEntityJob.js';
import { CreateParagraphExtractionEntityStatusesJob } from '#api/paragraphExtraction/jobs/CreateParagraphExtractionEntityStatusesJob.js';
import relationships from '#api/relationships/index.js';
import { InformationExtraction } from '#api/services/informationextraction/InformationExtraction.js';
import { IXTaskService } from '#api/services/informationextraction/TaskService.js';
import { TrainModelForPDF } from '#api/services/informationextraction/TrainModelForPDF.js';
import { TrainModelForText } from '#api/services/informationextraction/TrainModelForText.js';
import { IXTrainModelJob } from '#api/services/informationextraction/TrainModelJob.js';
import settings from '#api/settings/index.js';
import { AcceptSuggestionsFactory } from '#api/suggestions/infrastructure/AcceptSuggestionsFactory.js';
import { AcceptSuggestionsJob } from '#api/suggestions/jobs/AcceptSuggestionsJob.js';
import { CreateBlankStateSuggestionsJob } from '#api/suggestions/jobs/CreateBlankStateSuggestionsJob.js';
import { tenants } from '#api/tenants/tenantContext.js';

type Register = <T extends Dispatchable>(
  dispatchable: DispatchableClass<T>,
  factory: (namespace: string) => Promise<T>
) => void;

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

export function registerJobs(register: Register) {
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
    const settingsDS = SettingsDataSourceFactory.default({ transactionManager });

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
    return new PDFPostProcessJobHandler({
      useCase: PDFPostProcessJobFactory.default(),
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
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;

    return new TemplatePostProcessEntitiesJob({
      templatesDS: TemplatesDataSourceFactory.default({ transactionManager }),
      useCase: new TemplateUpdateDenormalizeEntitiesBatch({
        entitiesDS: EntitiesDataSourceFactory.default({ transactionManager }),
        filesDS: FilesDataSourceFactory.default(),
        relationshipsV1DS: new MongoRelationshipsV1DataSource(getConnection(), transactionManager),
        templatesDS: TemplatesDataSourceFactory.default({ transactionManager }),
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
    return new CsvExtractUploadedZipJobHandler({ useCase, sockets });
  });

  register(CsvPreflightJobHandler, async () => {
    const useCase = CsvPreflightJobFactory.default();
    const sockets = new V1WebSocketsWrapper();
    return new CsvPreflightJobHandler({ useCase, sockets });
  });

  register(CsvCreateThesauriValuesJobHandler, async () => {
    const useCase = CsvCreateThesauriValuesJobFactory.default();
    const sockets = new V1WebSocketsWrapper();
    return new CsvCreateThesauriValuesJobHandler({ useCase, sockets });
  });

  register(CsvCreateRelationshipEntitiesJobHandler, async () => {
    const useCase = CsvCreateRelationshipEntitiesJobFactory.default();
    const sockets = new V1WebSocketsWrapper();
    return new CsvCreateRelationshipEntitiesJobHandler({ useCase, sockets });
  });

  register(CsvImportEntitiesJobHandler, async () => {
    const useCase = CsvImportEntitiesJobFactory.default();
    const sockets = new V1WebSocketsWrapper();
    return new CsvImportEntitiesJobHandler({ useCase, sockets });
  });

  register(CsvCleanupImportFilesJobHandler, async () => {
    const useCase = CsvCleanupImportFilesJobFactory.default();
    return new CsvCleanupImportFilesJobHandler({ useCase });
  });

  register(EntityPreviewBatchHandler, async () => EntityPreviewBatchHandlerFactory.default());

  register(CloneLanguageEntitiesJob, async () => CloneLanguageEntitiesJobFactory.default());

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

    const entitiesDS = EntitiesDataSourceFactory.default({ transactionManager });
    const jobsDispatcher = DefaultDispatcher(tenants.current().name, transactionManager);

    return new DenormalizeThesaurusEntitiesHandler({ entitiesDS, jobsDispatcher });
  });

  register(
    DenormalizeEntityUpdatedListener.asJob(),
    async () =>
      new DenormalizeEntityUpdatedListener({
        denormalizeRelated,
        templatesDS: TemplatesDataSourceFactory.default({
          transactionManager: TransactionManagerFactory.default(),
        }),
      })
  );

  register(
    ProcessRelationshipAfterEntityUpdatedListener.asJob(),
    async () => new ProcessRelationshipAfterEntityUpdatedListener({})
  );

  register(AddLanguageListener.asJob(), async () => new AddLanguageListener({}));
}
