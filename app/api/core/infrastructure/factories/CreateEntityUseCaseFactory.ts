import { CreateEntityUseCase } from '#api/core/application/CreateEntity.js';
import { EntitiesService } from '#api/core/application/EntitiesService.js';
import { PropertyAssignmentCreatorServiceStrategy } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { MongoMultiLanguageEntityDataSource } from '#api/entities.v2/database/MongoMultiLanguageEntityDataSource.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoThesauriDataSource } from '#api/core/infrastructure/mongodb/thesauri/MongoThesauriDS.js';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';

class CreateEntityUseCaseFactory {
  static default() {
    const tenant = tenants.current();

    const transactionManager = TransactionManagerFactory.default();
    const jobsDispatcher = DefaultDispatcher(tenant.name, transactionManager);
    const idGenerator = IdGeneratorFactory.default();

    const settingsDS = SettingsDataSourceFactory.default(transactionManager);
    const templatesDS = TemplatesDataSourceFactory.default(transactionManager);
    const thesauriDS = new MongoThesauriDataSource(getConnection(), transactionManager);
    const translationsDS = DefaultTranslationsDataSource(transactionManager);
    const entitiesDS = new MongoMultiLanguageEntityDataSource(getConnection(), transactionManager);

    const eventBus = applicationEventsBus;

    const propertyAssignmentCreatorServiceStrategy =
      PropertyAssignmentCreatorServiceStrategy.create({
        entitiesDS,
        settingsDS,
        thesauriDS,
        translationsDS,
      });

    const entitiesService = new EntitiesService({
      entitiesDS,
      eventBus,
      settingsDS,
      templatesDS,
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
