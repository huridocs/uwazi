import { PropertyAssignmentCreatorServiceStrategy } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { UpdateEntityUseCase } from '#api/core/application/UpdateEntity.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { FilesServiceFactory } from './FilesServiceFactory.js';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory.js';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory.js';
import { TemplatesDataSourceFactory } from './TemplatesDataSourceFactory.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { FilesDataSourceFactory } from './FilesDataSourceFactory.js';
import { EntitiesServiceFactory } from './EntitiesServiceFactory.js';

class UpdateEntityUseCaseFactory {
  static default(overrides?: Partial<ConstructorParameters<typeof UpdateEntityUseCase>[0]>) {
    const { tenant } = ExecutionContext;

    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
    const { idGenerator, eventEmitter } = ExecutionContext;

    const settingsDS = SettingsDataSourceFactory.default();
    const thesauriDS = ThesauriDataSourceFactory.default();
    const entitiesDS = EntitiesDataSourceFactory.default();
    const translationsDS = DefaultTranslationsDataSource(transactionManager);
    const templatesDS = TemplatesDataSourceFactory.default();

    const propertyAssignmentCreatorServiceStrategy =
      PropertyAssignmentCreatorServiceStrategy.createWithRequired({
        entitiesDS,
        settingsDS,
        thesauriDS,
        translationsDS,
      });

    const filesDS = FilesDataSourceFactory.default();

    const fileService = FilesServiceFactory.default({ filesDS });

    const entitiesService = EntitiesServiceFactory.default();

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
        settingsDS,
        ...overrides,
      },
      { actor: ExecutionContext.actor, tenant }
    );

    return useCase;
  }
}

export { UpdateEntityUseCaseFactory };
