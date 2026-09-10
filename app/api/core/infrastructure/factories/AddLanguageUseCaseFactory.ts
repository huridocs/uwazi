import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { AddLanguageUseCase } from '#api/core/application/AddLanguage.js';
import { ImportPredefinedTranslationsService } from '#api/core/application/translation/ImportPredefinedTranslationsService.js';
import { SyncDispatcherForTests } from '#api/core/libs/queue/infrastructure/SyncDispatcherForTests.js';
import { DispatcherAdapter } from '../jobs/DispatcherAdapter.js';
import { CloneLanguageEntitiesJob } from '../jobs/CloneLanguageEntitiesJob.js';
import { CloneLanguageEntitiesJobFactory } from './CloneLanguageEntitiesJobFactory.js';
import { UwaziDispatcherFactory } from '#api/core/infrastructure/jobs/UwaziDispatcherFactory.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';

class AddLanguageUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof AddLanguageUseCase>[0]>
  ): AddLanguageUseCase {
    const { actor, tenant, eventEmitter } = ExecutionContext;
    const { transactionManager } = ExecutionContext;
    const settingsDS = SettingsDataSourceFactory.default();
    const translationsDS = TranslationsDataSourceFactory.default({ transactionManager });
    const importPredefinedTranslations = ImportPredefinedTranslationsService;

    const minutes60 = 60 * 60 * 1000;
    let jobsDispatcher: JobsDispatcher = UwaziDispatcherFactory(
      tenant.name,
      ExecutionContext.mongoTransactionManager,
      {
        lockWindow: minutes60,
      }
    );
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
