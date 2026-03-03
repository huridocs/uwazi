import { PropertyAssignmentCreatorServiceStrategy } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { UpdateEntityUseCase } from '#api/core/application/UpdateEntity.js';
import { DependenciesContext } from '#api/core/libs/DependenciesContext.js';
import { FilesServiceFactory } from './FilesServiceFactory.js';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory.js';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory.js';
import { TemplatesDataSourceFactory } from './TemplatesDataSourceFactory.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { FilesDataSourceFactory } from './FilesDataSourceFactory.js';
import { EntitiesServiceFactory } from './EntitiesServiceFactory.js';

class UpdateEntityUseCaseFactory {
  static default() {
    const tenant = tenants.current();

    const transactionManager = DependenciesContext.transactionManager as MongoTransactionManager;
    const { idGenerator, eventEmitter } = DependenciesContext;

    const settingsDS = SettingsDataSourceFactory.default(transactionManager);
    const thesauriDS = ThesauriDataSourceFactory.default(transactionManager);
    const entitiesDS = EntitiesDataSourceFactory.default(transactionManager);
    const translationsDS = DefaultTranslationsDataSource(transactionManager);
    const templatesDS = TemplatesDataSourceFactory.default(transactionManager);

    const propertyAssignmentCreatorServiceStrategy =
      PropertyAssignmentCreatorServiceStrategy.createWithRequired({
        entitiesDS,
        settingsDS,
        thesauriDS,
        translationsDS,
      });

    const filesDS = FilesDataSourceFactory.default(transactionManager);

    const fileService = FilesServiceFactory.default(transactionManager, {
      filesDS,
      transactionManager,
    });

    const entitiesService = EntitiesServiceFactory.default({
      transactionManager,
      entitiesDS,
      eventEmitter,
      settingsDS,
      templatesDS,
    });

    const useCase = new UpdateEntityUseCase(
      {
        filesDS,
        entitiesService,
        entitiesDS,
        templatesDS,
        eventEmitter,
        propertyAssignmentCreatorServiceStrategy,
        fileService,
        idGenerator,
        transactionManager,
      },
      { actor: permissionsContext.getUserInContext()!, tenant }
    );

    return useCase;
  }
}

export { UpdateEntityUseCaseFactory };
