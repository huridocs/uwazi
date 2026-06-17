import { PropertyAssignmentCreatorServiceStrategy } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { MultiUpdateEntity } from '#api/core/application/MultiUpdateEntity.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory.js';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory.js';
import { TemplatesDataSourceFactory } from './TemplatesDataSourceFactory.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { EntitiesServiceFactory } from './EntitiesServiceFactory.js';

class MultiUpdateEntityUseCaseFactory {
  static default() {
    const { tenant } = ExecutionContext;

    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;

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

    const entitiesService = EntitiesServiceFactory.default();

    const useCase = new MultiUpdateEntity(
      {
        entitiesDS,
        entitiesService,
        templatesDS,
        propertyAssignmentCreatorServiceStrategy,
        transactionManager,
      },
      { actor: ExecutionContext.actor, tenant }
    );

    return useCase;
  }
}

export { MultiUpdateEntityUseCaseFactory };
