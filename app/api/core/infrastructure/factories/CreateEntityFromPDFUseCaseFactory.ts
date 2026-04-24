import { PropertyAssignmentCreatorServiceStrategy } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { DefaultDispatcher, NoOpDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';
import { IdGeneratorFactory } from './IdGeneratorFactory.js';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory.js';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory.js';
import { EntitiesServiceFactory } from './EntitiesServiceFactory.js';
import { CreateEntityFromPDFUseCase } from '#api/core/application/CreateEntityFromPDF.js';
import { DispatcherAdapter } from '../jobs/DispatcherAdapter.js';

class CreateEntityFromPDFUseCaseFactory {
  static default(targetLanguage: LanguageISO6391) {
    const tenant = tenants.current();

    const transactionManager = TransactionManagerFactory.default();

    const dispatcher = new DispatcherAdapter(
      process.env.NODE_ENV === 'test'
        ? NoOpDispatcher()
        : DefaultDispatcher(tenant.name, transactionManager)
    );

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
      dispatcher,
    });

    const useCase = new CreateEntityFromPDFUseCase(
      {
        entitiesService,
        propertyAssignmentCreatorServiceStrategy,
        idGenerator,
        transactionManager,
        eventBus,
      },
      { actor: permissionsContext.getUserInContext()!, tenant, targetLanguage }
    );

    return useCase;
  }
}

export { CreateEntityFromPDFUseCaseFactory };
