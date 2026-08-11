import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { AddLanguageUseCase } from '#api/core/application/AddLanguage.js';
import { ImportPredefinedTranslationsService } from '#api/core/application/translation/ImportPredefinedTranslationsService.js';
import { SyncDispatcherForTests } from '#api/core/libs/queue/infrastructure/SyncDispatcherForTests.js';
import { DispatcherAdapter } from '../jobs/DispatcherAdapter.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { CloneLanguageEntitiesJob } from '../jobs/CloneLanguageEntitiesJob.js';
import { CloneLanguageEntitiesJobFactory } from './CloneLanguageEntitiesJobFactory.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';

class AddLanguageUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof AddLanguageUseCase>[0]>
  ): AddLanguageUseCase {
    const { actor, tenant, eventEmitter } = ExecutionContext;
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
    const settingsDS = SettingsDataSourceFactory.default({ transactionManager });
    const translationsDS = TranslationsDataSourceFactory.default({ transactionManager });
    const importPredefinedTranslations = ImportPredefinedTranslationsService;

    const minutes60 = 60 * 60 * 1000;
    let jobsDispatcher: JobsDispatcher = DefaultDispatcher(tenant.name, transactionManager, {
      lockWindow: minutes60,
    });
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
        importPredefinedTranslations,
        eventEmitter,
        dispatcher,
        ...overrides,
      },
      { actor, tenant }
    );
  }
}

export { AddLanguageUseCaseFactory };
