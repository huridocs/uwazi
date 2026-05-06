import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { AddLanguageUseCase } from '#api/core/application/AddLanguage.js';
import { SyncDispatcherForTests } from '#api/core/libs/queue/infrastructure/SyncDispatcherForTests.js';
import { LegacyTranslationService } from '../mongodb/template/LegacyTemplatesTranslationService.js';
import { DispatcherAdapter } from '../jobs/DispatcherAdapter.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { CloneLanguageEntitiesJob } from '../jobs/CloneLanguageEntitiesJob.js';
import { CloneLanguageEntitiesJobFactory } from './CloneLanguageEntitiesJobFactory.js';

class AddLanguageUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof AddLanguageUseCase>[0]>
  ): AddLanguageUseCase {
    const { actor, tenant } = ExecutionContext;
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
    const settingsDS = SettingsDataSourceFactory.default({ transactionManager });
    const translationsDS = DefaultTranslationsDataSource(transactionManager);
    const eventEmitter = ExecutionContext.eventEmitter;
    const translationService = new LegacyTranslationService();

    let jobsDispatcher = ExecutionContext.jobsDispatcher;
    if (process.env.NODE_ENV === 'test') {
      const innerDispatcher = new SyncDispatcherForTests({});
      const cloneJob = CloneLanguageEntitiesJobFactory.default({ jobsDispatcher: innerDispatcher });
      jobsDispatcher = new SyncDispatcherForTests({
        [CloneLanguageEntitiesJob.name]: async () => cloneJob,
      });
    }
    const dispatcher = new DispatcherAdapter(jobsDispatcher);

    return new AddLanguageUseCase(
      {
        transactionManager,
        settingsDS,
        translationsDS,
        translationService,
        eventEmitter,
        dispatcher,
        ...overrides,
      },
      { actor, tenant }
    );
  }
}

export { AddLanguageUseCaseFactory };
