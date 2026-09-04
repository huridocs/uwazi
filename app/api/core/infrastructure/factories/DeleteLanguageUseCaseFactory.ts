import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DeleteLanguageUseCase } from '#api/core/application/DeleteLanguage.js';
import { SyncDispatcherForTests } from '#api/core/libs/queue/infrastructure/SyncDispatcherForTests.js';
import { DispatcherAdapter } from '../jobs/DispatcherAdapter.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { DeleteLanguageEntitiesJob } from '../jobs/DeleteLanguageEntitiesJob.js';
import { DeleteLanguageEntitiesJobFactory } from './DeleteLanguageEntitiesJobFactory.js';
import { UwaziDispatcherFactory } from '#api/core/infrastructure/jobs/UwaziDispatcherFactory.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';

const ONE_HOUR_MS = 60 * 60 * 1000;

const createDeleteLanguageJobsDispatcher = (
  tenantName: string,
  transactionManager: MongoTransactionManager
): JobsDispatcher => {
  if (process.env.NODE_ENV !== 'test') {
    return UwaziDispatcherFactory(tenantName, transactionManager, { lockWindow: ONE_HOUR_MS });
  }

  const deleteJob = DeleteLanguageEntitiesJobFactory.default();
  return new SyncDispatcherForTests({
    [DeleteLanguageEntitiesJob.name]: async () => deleteJob,
  });
};

class DeleteLanguageUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof DeleteLanguageUseCase>[0]>
  ): DeleteLanguageUseCase {
    const { actor, tenant, eventEmitter } = ExecutionContext;
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;

    return new DeleteLanguageUseCase(
      {
        transactionManager,
        settingsDS: SettingsDataSourceFactory.default(),
        translationsDS: TranslationsDataSourceFactory.default({ transactionManager }),
        eventEmitter,
        dispatcher: new DispatcherAdapter(
          createDeleteLanguageJobsDispatcher(tenant.name, transactionManager)
        ),
        ...overrides,
      },
      { actor, tenant }
    );
  }
}

export { DeleteLanguageUseCaseFactory };
