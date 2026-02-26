import { CreateEntityUseCase } from '#api/core/application/CreateEntity.js';
import { PropertyAssignmentCreatorServiceStrategy } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { DefaultDispatcher, NoOpDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { FilesServiceFactory } from './FilesServiceFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';
import { IdGeneratorFactory } from './IdGeneratorFactory.js';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory.js';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory.js';
import { EntitiesServiceFactory } from './EntitiesServiceFactory.js';

class CreateEntityUseCaseFactory {
  static default(targetLanguage: LanguageISO6391) {
    const tenant = tenants.current();

    const transactionManager = TransactionManagerFactory.default();

    const jobsDispatcher =
      process.env.NODE_ENV === 'test'
        ? NoOpDispatcher()
        : DefaultDispatcher(tenant.name, transactionManager);

    const idGenerator = IdGeneratorFactory.default();
    const eventBus = applicationEventsBus;

    const settingsDS = SettingsDataSourceFactory.default(transactionManager);
    const thesauriDS = ThesauriDataSourceFactory.default(transactionManager);
    const entitiesDS = EntitiesDataSourceFactory.default(transactionManager);
    const translationsDS = DefaultTranslationsDataSource(transactionManager);

    const propertyAssignmentCreatorServiceStrategy =
      PropertyAssignmentCreatorServiceStrategy.create({
        entitiesDS,
        settingsDS,
        thesauriDS,
        translationsDS,
      });

    const entitiesService = EntitiesServiceFactory.default({
      entitiesDS,
      eventBus,
      settingsDS,
      transactionManager,
      dispatcher: jobsDispatcher,
    });

    const fileService = FilesServiceFactory.default(transactionManager, { jobsDispatcher });

    const useCase = new CreateEntityUseCase(
      {
        entitiesService,
        propertyAssignmentCreatorServiceStrategy,
        fileService,
        idGenerator,
        transactionManager,
        eventBus,
      },
      { actor: permissionsContext.getUserInContext()!, tenant, targetLanguage }
    );

    return useCase;
  }
}

export { CreateEntityUseCaseFactory };
