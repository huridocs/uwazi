/* eslint-disable max-classes-per-file */
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { ValidationError } from 'api/common.v2/validation/ValidationError';
import { MongoPXEntitiesStatusDataSource } from 'api/paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource';
import { PXCreateParagraphsFactory } from 'api/paragraphExtraction/infrastructure/PXCreateParagraphsFactory';
import { PXCreateParagraphsJob } from 'api/paragraphExtraction/infrastructure/PXCreateParagraphsJob';
import { PXExtractionServiceFactory } from 'api/paragraphExtraction/infrastructure/PXExtractionServiceFactory';
import { PXExtractorsQueryServiceFactory } from 'api/paragraphExtraction/infrastructure/PXExtractorsQueryServiceFactory';
import { PXExtractParagraphsFromEntityJob } from 'api/paragraphExtraction/infrastructure/PXExtractParagraphsFromEntityJob';
import { Dispatchable, HeartbeatCallback } from 'api/queue.v2/application/contracts/Dispatchable';
import { DispatchableClass } from 'api/queue.v2/application/contracts/JobsDispatcher';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { PXCreateEntityStatusesFactory } from 'api/paragraphExtraction/infrastructure/PXCreateEntityStatusesFactory';
import { DefaultDispatcher } from './api/queue.v2/configuration/factories';
import { CreateParagraphExtractionEntityStatusesJob } from './api/paragraphExtraction/jobs/CreateParagraphExtractionEntityStatusesJob';

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

  register(PXExtractParagraphsFromEntityJob, async () => new PXExtractParagraphsFromEntityJob());

  register(PXCreateParagraphsJob, async () => {
    const transactionManager = DefaultTransactionManager();
    const connection = getConnection();
    const extractorsQueryService = PXExtractorsQueryServiceFactory.createDefault({
      connection,
      transactionManager,
    });
    const settingsDS = DefaultSettingsDataSource(transactionManager);

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
}
