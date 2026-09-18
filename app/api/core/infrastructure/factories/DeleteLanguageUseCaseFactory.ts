import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DeleteLanguageUseCase } from '#api/core/application/DeleteLanguage.js';
import { SyncDispatcherForTests } from '#api/core/libs/queue/infrastructure/SyncDispatcherForTests.js';
import { DeleteLanguageEntitiesJob } from '../jobs/DeleteLanguageEntitiesJob.js';
import { DeleteLanguageEntitiesJobFactory } from './DeleteLanguageEntitiesJobFactory.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { DispatcherFactory } from '#api/core/infrastructure/factories/DispatcherFactory.js';

const createDeleteLanguageJobsDispatcher = (): JobsDispatcher => {
  if (process.env.NODE_ENV !== 'test') {
    return ExecutionContext.jobsDispatcher;
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
    const { actor, tenant, eventEmitter, transactionManager } = ExecutionContext;

    return new DeleteLanguageUseCase(
      {
        transactionManager,
        settingsDS: SettingsDataSourceFactory.default(),
        translationsDS: TranslationsDataSourceFactory.default({ transactionManager }),
        eventEmitter,
        dispatcher: DispatcherFactory.default(createDeleteLanguageJobsDispatcher()),
        ...overrides,
      },
      { actor, tenant }
    );
  }
}

export { DeleteLanguageUseCaseFactory };
