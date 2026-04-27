import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { DeleteTemplateUseCase } from '#api/core/application/DeleteTemplate.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { DefaultEntitiesDataSource } from '#api/entities.v2/database/data_source_defaults.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory.js';

class DeleteTemplateUseCaseFactory {
  static default(overrides?: Partial<ConstructorParameters<typeof DeleteTemplateUseCase>[0]>) {
    const tenant = ExecutionContext.tenant;
    const actor = ExecutionContext.actor;
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
    const eventBus = applicationEventsBus;
    const templatesDS = TemplatesDataSourceFactory.default(transactionManager);
    const settingsDS = SettingsDataSourceFactory.default(transactionManager);
    const translationsDS = DefaultTranslationsDataSource(transactionManager);
    const entitiesDS = DefaultEntitiesDataSource(transactionManager);
    const multiLanguageEntitiesDS = EntitiesDataSourceFactory.default(transactionManager);

    return new DeleteTemplateUseCase(
      {
        eventBus,
        transactionManager,
        entitiesDS,
        templatesDS,
        settingsDS,
        translationsDS,
        multiLanguageEntitiesDS,
        jobsDispatcher: ExecutionContext.jobsDispatcher,
        ...overrides,
      },
      { actor, tenant }
    );
  }
}

export { DeleteTemplateUseCaseFactory };
