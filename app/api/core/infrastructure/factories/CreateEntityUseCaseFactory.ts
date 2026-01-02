import { CreateEntityUseCase } from 'api/core/application/CreateEntity';
import { EntitiesService } from 'api/core/application/EntitiesService';
import { PropertyAssignmentCreatorServiceStrategy } from 'api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { applicationEventsBus } from 'api/core/libs/eventsbus';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants/tenantContext';
import { DependenciesContext } from 'api/core/libs/DependenciesContext';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant';
import { MongoThesauriDataSource } from '../mongodb/thesauri/MongoThesauriDS';
import { FilesServiceFactory } from './FilesServiceFactory';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager';

class CreateEntityUseCaseFactory {
  static default() {
    const transactionManager = DependenciesContext.transactionManager as MongoTransactionManager;
    const { jobsDispatcher, idGenerator, eventEmitter } = DependenciesContext;

    const tenant = tenants.current();
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
        eventEmitter,
      },
      { actor: permissionsContext.getUserInContext()!, tenant }
    );

    return useCase;
  }
}

export { CreateEntityUseCaseFactory };
