import { CreateEntityUseCase } from 'api/core/application/CreateEntity';
import { PropertyAssignmentCreatorServiceStrategy } from 'api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { applicationEventsBus } from 'api/core/libs/eventsbus';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants/tenantContext';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { FilesServiceFactory } from './FilesServiceFactory';
import { TransactionManagerFactory } from './TransactionManagerFactory';
import { IdGeneratorFactory } from './IdGeneratorFactory';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory';
import { EntitiesServiceFactory } from './EntitiesServiceFactory';

class CreateEntityUseCaseFactory {
  static default() {
    const tenant = tenants.current();

    const transactionManager = TransactionManagerFactory.default();
    const jobsDispatcher = DefaultDispatcher(tenant.name, transactionManager);
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

    const fileService = FilesServiceFactory.default(transactionManager);

    const useCase = new CreateEntityUseCase(
      {
        entitiesService,
        propertyAssignmentCreatorServiceStrategy,
        fileService,
        idGenerator,
        transactionManager,
        eventBus,
      },
      { actor: permissionsContext.getUserInContext()!, tenant }
    );

    return useCase;
  }
}

export { CreateEntityUseCaseFactory };
