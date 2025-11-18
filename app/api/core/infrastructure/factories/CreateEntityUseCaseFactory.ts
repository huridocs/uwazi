import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { CreateEntityUseCase } from 'api/core/application/CreateEntity';
import { FileStorageStrategyFactory } from 'api/files.v2/infrastructure/FileStorageStrategyFactory';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants/tenantContext';
import { applicationEventsBus } from 'api/core/libs/eventsbus';
import { FilesService } from 'api/core/application/FilesService';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { EntitiesService } from 'api/core/application/EntitiesService';
import { PropertyAssignmentCreatorServiceStrategy } from 'api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy';
import { MongoThesauriDataSource } from '../mongodb/thesauri/MongoThesauriDS';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant';

class CreateEntityUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const tenant = tenants.current();
    const jobsDispatcher = DefaultDispatcher(tenant.name);
    const settingsDS = SettingsDataSourceFactory.default(transactionManager);
    const idGenerator = IdGeneratorFactory.default();
    const templatesDS = TemplatesDataSourceFactory.default(transactionManager);
    const fileStorage = FileStorageStrategyFactory.createDefault();
    const filesDS = DefaultFilesDataSource(transactionManager);
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

    const fileService = new FilesService({
      idGenerator,
      filesDS,
      fileStorage,
      jobsDispatcher,
    });

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
