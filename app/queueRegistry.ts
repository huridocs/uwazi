/* eslint-disable max-classes-per-file */
import { ValidationError } from 'api/common.v2/validation/ValidationError';
import { PDFPostProcess } from 'api/core/application/PDFPostProcess';
import { TemplateUpdateDenormalizeEntitiesBatch } from 'api/core/application/TemplateUpdateDenormalizeEntitiesBatch';
import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { PDFPostProcessJob } from 'api/core/infrastructure/jobs/PDFPostProcessJob';
import { TemplatePostProcessEntitiesJob } from 'api/core/infrastructure/jobs/TemplatePostProcessEntitiesJob';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { PDFService } from 'api/core/infrastructure/services/PDFService';
import { V1WebSocketsWrapper } from 'api/core/infrastructure/services/V1WebSocketsWrapper';
import {
  Dispatchable,
  HeartbeatCallback,
} from 'api/core/libs/queue/application/contracts/Dispatchable';
import { DispatchableClass } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import { FileStorageStrategyFactory } from 'api/files.v2/infrastructure/FileStorageStrategyFactory';
import { MongoPXEntitiesStatusDataSource } from 'api/paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource';
import { PXCreateEntityStatusesFactory } from 'api/paragraphExtraction/infrastructure/PXCreateEntityStatusesFactory';
import { PXCreateParagraphsFactory } from 'api/paragraphExtraction/infrastructure/PXCreateParagraphsFactory';
import { PXCreateParagraphsJob } from 'api/paragraphExtraction/infrastructure/PXCreateParagraphsJob';
import { PXExtractionServiceFactory } from 'api/paragraphExtraction/infrastructure/PXExtractionServiceFactory';
import { PXExtractorsQueryServiceFactory } from 'api/paragraphExtraction/infrastructure/PXExtractorsQueryServiceFactory';
import { PXExtractParagraphsFromEntityJob } from 'api/paragraphExtraction/infrastructure/PXExtractParagraphsFromEntityJob';
import { MongoRelationshipsV1DataSource } from 'api/relationships/MongoRelationshipsV1DataSource';
import { InformationExtraction } from 'api/services/informationextraction/InformationExtraction';
import { IXTaskService } from 'api/services/informationextraction/TaskService';
import { TrainModelForPDF } from 'api/services/informationextraction/TrainModelForPDF';
import { TrainModelForText } from 'api/services/informationextraction/TrainModelForText';
import { IXTrainModelJob } from 'api/services/informationextraction/TrainModelJob';
import settings from 'api/settings';
import { AcceptSuggestionsFactory } from 'api/suggestions/infrastructure/AcceptSuggestionsFactory';
import { AcceptSuggestionsJob } from 'api/suggestions/jobs/AcceptSuggestionsJob';
import { CreateBlankStateSuggestionsJob } from 'api/suggestions/jobs/CreateBlankStateSuggestionsJob';
import { DefaultDispatcher } from './api/core/libs/queue/configuration/factories';
import { CreateParagraphExtractionEntityStatusesJob } from './api/paragraphExtraction/jobs/CreateParagraphExtractionEntityStatusesJob';
import { FileContentsIO } from 'api/core/infrastructure/files/FileContentIO';

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
              new ValidationError([{ path: '/', message: 'Random validation error occurred' }])
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
    const useCase = PXCreateEntityStatusesFactory.createDefault({ batchSize });
    const dispatcher = await DefaultDispatcher(namespace, { lockWindow: 1000 * 60 });

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
      trainModelForPDF: new TrainModelForPDF({ tenantName, serviceUrl, iXTaskService }),
      trainModelForText: new TrainModelForText({ iXTaskService, tenantName, serviceUrl }),
    });
  });

  register(PDFPostProcessJob, async (_tenantName: string) => {
    const transactionManager = TransactionManagerFactory.default();
    return new PDFPostProcessJob({
      useCase: new PDFPostProcess({
        transactionManager,
        filesDS: DefaultFilesDataSource(transactionManager),
        fileStorage: FileStorageStrategyFactory.createDefault(),
        pdfService: new PDFService(),
        idGenerator: IdGeneratorFactory.default(),
        filesIO: new FileContentsIO(),
      }),
      wSockets: new V1WebSocketsWrapper(),
    });
  });

  register(AcceptSuggestionsJob, async (tenantName: string) => {
    const { job } = await AcceptSuggestionsFactory.createDefault({ tenantName });
    return job;
  });

  register(TemplatePostProcessEntitiesJob, async () => {
    const transactionManager = TransactionManagerFactory.default();

    return new TemplatePostProcessEntitiesJob({
      templatesDS: TemplatesDataSourceFactory.default(transactionManager),
      useCase: new TemplateUpdateDenormalizeEntitiesBatch({
        entitiesDS: new MongoMultiLanguageEntityDataSource(
          getConnection(),
          transactionManager,
          TemplatesDataSourceFactory.default(transactionManager)
        ),
        filesDS: DefaultFilesDataSource(transactionManager),
        relationshipsV1DS: new MongoRelationshipsV1DataSource(getConnection(), transactionManager),
        templatesDS: TemplatesDataSourceFactory.default(transactionManager),
        transactionManager,
      }),
    });
  });
}
