import { UpdateTemplateUseCase } from '#api/core/application/UpdateTemplate.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DefaultRelationshipTypesDataSource } from '#api/relationshiptypes.v2/database/data_source_defaults.js';
import { DispatcherAdapter } from '../jobs/DispatcherAdapter.js';
import { LegacyTranslationService } from '../mongodb/template/LegacyTemplatesTranslationService.js';
import { MongoThesauriDataSource } from '../mongodb/thesauri/MongoThesauriDS.js';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory.js';

class UpdateTemplateUseCaseFactory {
  static default(overrides?: Partial<ConstructorParameters<typeof UpdateTemplateUseCase>[0]>) {
    const transactionManager = TransactionManagerFactory.default();
    const templatesDS = TemplatesDataSourceFactory.default(transactionManager);
    const db = getConnection();
    const entitiesDS = EntitiesDataSourceFactory.default(transactionManager);
    const thesauriDS = new MongoThesauriDataSource(db, transactionManager);
    const translationService = new LegacyTranslationService();
    const settingsDS = SettingsDataSourceFactory.default(transactionManager);
    const relationshipTypesDS = DefaultRelationshipTypesDataSource(transactionManager);
    const idGenerator = IdGeneratorFactory.default();
    const eventBus = applicationEventsBus;

    return new UpdateTemplateUseCase(
      {
        idGenerator,
        eventBus,
        transactionManager,
        templatesDS,
        entitiesDS,
        thesauriDS,
        translationService,
        settingsDS,
        relationshipTypesDS,
        dispatcher: new DispatcherAdapter(ExecutionContext.jobsDispatcher),
        ...overrides,
      },
      { actor: ExecutionContext.actor, tenant: ExecutionContext.tenant }
    );
  }
}

export { UpdateTemplateUseCaseFactory };
