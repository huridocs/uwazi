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
import { UwaziDispatcherFactory } from '#api/core/infrastructure/jobs/UwaziDispatcherFactory.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';

const ONE_HOUR_MS = 60 * 60 * 1000;

const createAddLanguageJobsDispatcher = (
  tenantName: string,
  transactionManager: MongoTransactionManager
): JobsDispatcher => {
  if (process.env.NODE_ENV !== 'test') {
    return UwaziDispatcherFactory(tenantName, transactionManager, { lockWindow: ONE_HOUR_MS });
  }

  const innerDispatcher = new SyncDispatcherForTests({});
  const cloneJob = CloneLanguageEntitiesJobFactory.default({ jobsDispatcher: innerDispatcher });
  return new SyncDispatcherForTests({
    [CloneLanguageEntitiesJob.name]: async () => cloneJob,
  });
};

class AddLanguageUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof AddLanguageUseCase>[0]>
  ): AddLanguageUseCase {
    const { actor, tenant, eventEmitter } = ExecutionContext;
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;

    return new AddLanguageUseCase(
      {
        transactionManager,
        settingsDS: SettingsDataSourceFactory.default(),
        translationsDS: TranslationsDataSourceFactory.default({ transactionManager }),
        importPredefinedTranslations: ImportPredefinedTranslationsService,
        eventEmitter,
        dispatcher: new DispatcherAdapter(
          createAddLanguageJobsDispatcher(tenant.name, transactionManager)
        ),
        ...overrides,
      },
      { actor, tenant }
    );
  }
}

export { AddLanguageUseCaseFactory };
