import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DeleteLanguageUseCase } from '#api/core/application/DeleteLanguage.js';
import { SyncDispatcherForTests } from '#api/core/libs/queue/infrastructure/SyncDispatcherForTests.js';
import { DispatcherAdapter } from '../jobs/DispatcherAdapter.js';
import { DeleteLanguageEntitiesJob } from '../jobs/DeleteLanguageEntitiesJob.js';
import { DeleteLanguageEntitiesJobFactory } from './DeleteLanguageEntitiesJobFactory.js';
import { UwaziDispatcherFactory } from '#api/core/infrastructure/jobs/UwaziDispatcherFactory.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';

class DeleteLanguageUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof DeleteLanguageUseCase>[0]>
  ): DeleteLanguageUseCase {
    const { actor, tenant, eventEmitter } = ExecutionContext;
    const { transactionManager } = ExecutionContext;
    const settingsDS = SettingsDataSourceFactory.default({
      transactionManager: ExecutionContext.mongoTransactionManager,
    });
    const translationsDS = TranslationsDataSourceFactory.default({ transactionManager });

    const minutes60 = 60 * 60 * 1000;
    let jobsDispatcher: JobsDispatcher = UwaziDispatcherFactory(
      tenant.name,
      ExecutionContext.mongoTransactionManager,
      {
        lockWindow: minutes60,
      }
    );
    if (process.env.NODE_ENV === 'test') {
      const deleteJob = DeleteLanguageEntitiesJobFactory.default();
      jobsDispatcher = new SyncDispatcherForTests({
        [DeleteLanguageEntitiesJob.name]: async () => deleteJob,
      });
    }
    const dispatcher = new DispatcherAdapter(jobsDispatcher);

    return new DeleteLanguageUseCase(
      {
        transactionManager,
        settingsDS,
        translationsDS,
        eventEmitter,
        dispatcher,
        ...overrides,
      },
      { actor, tenant }
    );
  }
}

export { DeleteLanguageUseCaseFactory };
