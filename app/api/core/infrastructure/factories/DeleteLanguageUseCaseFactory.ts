import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DeleteLanguageUseCase } from '#api/core/application/DeleteLanguage.js';
import { SyncDispatcherForTests } from '#api/core/libs/queue/infrastructure/SyncDispatcherForTests.js';
import { DispatcherAdapter } from '../jobs/DispatcherAdapter.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { DeleteLanguageEntitiesJob } from '../jobs/DeleteLanguageEntitiesJob.js';
import { DeleteLanguageEntitiesJobFactory } from './DeleteLanguageEntitiesJobFactory.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';

class DeleteLanguageUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof DeleteLanguageUseCase>[0]>
  ): DeleteLanguageUseCase {
    const { actor, tenant, eventEmitter } = ExecutionContext;
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
    const settingsDS = SettingsDataSourceFactory.default({ transactionManager });
    const translationsDS = DefaultTranslationsDataSource(transactionManager);

    const minutes60 = 60 * 60 * 1000;
    let jobsDispatcher: JobsDispatcher = DefaultDispatcher(tenant.name, transactionManager, {
      lockWindow: minutes60,
    });
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
