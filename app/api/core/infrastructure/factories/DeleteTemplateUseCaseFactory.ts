import { DeleteTemplateUseCase } from '#api/core/application/DeleteTemplate.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { TranslationsServiceFactory } from '#api/core/infrastructure/factories/TranslationsServiceFactory.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DispatcherAdapter } from '../jobs/DispatcherAdapter.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory.js';

class DeleteTemplateUseCaseFactory {
  static default(overrides?: Partial<ConstructorParameters<typeof DeleteTemplateUseCase>[0]>) {
    const { tenant, actor } = ExecutionContext;
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
    const eventBus = applicationEventsBus;
    const templatesDS = TemplatesDataSourceFactory.default();
    const settingsDS = SettingsDataSourceFactory.default();
    const translationsService = TranslationsServiceFactory.default({ transactionManager });
    const multiLanguageEntitiesDS = EntitiesDataSourceFactory.default();

    return new DeleteTemplateUseCase(
      {
        eventBus,
        transactionManager,
        templatesDS,
        settingsDS,
        translationsService,
        multiLanguageEntitiesDS,
        dispatcher: new DispatcherAdapter(ExecutionContext.jobsDispatcher),
        ...overrides,
      },
      { actor, tenant }
    );
  }
}

export { DeleteTemplateUseCaseFactory };
