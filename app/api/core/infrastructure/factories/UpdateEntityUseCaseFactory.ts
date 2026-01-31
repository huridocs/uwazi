import { PropertyAssignmentCreatorServiceStrategy } from 'api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants/tenantContext';
import { UpdateEntityUseCase } from 'api/core/application/UpdateEntity';
import { EventEmitterFactory } from 'api/core/libs/eventEmitter/EventEmitterFactory';
import { DependenciesContext } from 'api/core/libs/DependenciesContext';
import { FilesServiceFactory } from './FilesServiceFactory';
import { IdGeneratorFactory } from './IdGeneratorFactory';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory';
import { TemplatesDataSourceFactory } from './TemplatesDataSourceFactory';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager';

class UpdateEntityUseCaseFactory {
  static default() {
    const tenant = tenants.current();

    const transactionManager = DependenciesContext.transactionManager as MongoTransactionManager;
    const idGenerator = IdGeneratorFactory.default();

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

    const fileService = FilesServiceFactory.default(transactionManager);

    const templatesDS = TemplatesDataSourceFactory.default(transactionManager);

    const eventEmitter = EventEmitterFactory.default();

    const useCase = new UpdateEntityUseCase(
      {
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
