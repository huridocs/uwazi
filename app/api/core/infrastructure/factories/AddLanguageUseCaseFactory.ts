import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { AddLanguageUseCase } from '#api/core/application/AddLanguage.js';
import { SyncDispatcherForTests } from '#api/core/libs/queue/infrastructure/SyncDispatcherForTests.js';
import { DispatcherAdapter } from '../jobs/DispatcherAdapter.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { CloneLanguageEntitiesJob } from '../jobs/CloneLanguageEntitiesJob.js';
import { ImportPredefinedTranslationsJob } from '../jobs/ImportPredefinedTranslationsJob.js';
import { CloneLanguageEntitiesJobFactory } from './CloneLanguageEntitiesJobFactory.js';
import { ImportPredefinedTranslationsJobFactory } from './ImportPredefinedTranslationsJobFactory.js';

class AddLanguageUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof AddLanguageUseCase>[0]>
  ): AddLanguageUseCase {
    const { tenant, actor } = ExecutionContext;
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
    const settingsDS = SettingsDataSourceFactory.default({ transactionManager });
    const translationsDS = DefaultTranslationsDataSource(transactionManager);
    const eventEmitter = ExecutionContext.eventEmitter;

    let jobsDispatcher = ExecutionContext.jobsDispatcher;
    if (process.env.NODE_ENV === 'test') {
      const innerDispatcher = new SyncDispatcherForTests({});
      const cloneJob = CloneLanguageEntitiesJobFactory.default({ jobsDispatcher: innerDispatcher });
      const importJob = ImportPredefinedTranslationsJobFactory.default();
      jobsDispatcher = new SyncDispatcherForTests({
        [CloneLanguageEntitiesJob.name]: async () => cloneJob,
        [ImportPredefinedTranslationsJob.name]: async () => importJob,
      });
    }
    const dispatcher = new DispatcherAdapter(jobsDispatcher);

    return new AddLanguageUseCase(
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

export { AddLanguageUseCaseFactory };
