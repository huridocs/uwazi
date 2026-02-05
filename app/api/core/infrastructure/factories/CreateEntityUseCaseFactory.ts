import { CreateEntityUseCase } from 'api/core/application/CreateEntity';
import { PropertyAssignmentCreatorServiceStrategy } from 'api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { applicationEventsBus } from 'api/core/libs/eventsbus';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants/tenantContext';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
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

    let jobsDispatcher: JobsDispatcher = DefaultDispatcher(tenant.name, transactionManager);

    // In test environment, use a no-op dispatcher that doesn't create jobs in DB
    if (process.env.NODE_ENV === 'test') {
      jobsDispatcher = {
        async dispatch() {
          // No-op: don't create jobs in test DB
        },
        async dispatchMany(callback) {
          // No-op: don't create jobs in test DB
          await callback(async () => {});
        },
        async deleteByParams() {
          // No-op: nothing to delete
        },
      };
    }

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
      { actor: permissionsContext.getUserInContext()!, tenant }
    );

    return useCase;
  }
}

export { CreateEntityUseCaseFactory };
