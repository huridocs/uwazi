import { PropertyAssignmentCreatorServiceStrategy } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';
import { MultiUpdateEntity } from '#api/core/application/MultiUpdateEntity.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory.js';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory.js';
import { TemplatesDataSourceFactory } from './TemplatesDataSourceFactory.js';
import { EntitiesServiceFactory } from './EntitiesServiceFactory.js';

class MultiUpdateEntityUseCaseFactory {
  static default() {
    const { tenant, transactionManager } = ExecutionContext;
    const deps = MultiUpdateEntityUseCaseFactory.dependencies(transactionManager);

    return new MultiUpdateEntity(deps, { actor: ExecutionContext.actor, tenant });
  }

  private static dependencies(transactionManager: typeof ExecutionContext.transactionManager) {
    const settingsDS = SettingsDataSourceFactory.default();
    const thesauriDS = ThesauriDataSourceFactory.default();
    const entitiesDS = EntitiesDataSourceFactory.default();
    const translationsDS = TranslationsDataSourceFactory.default({ transactionManager });
    const templatesDS = TemplatesDataSourceFactory.default();
    const propertyAssignmentCreatorServiceStrategy =
      PropertyAssignmentCreatorServiceStrategy.createWithRequired({
        entitiesDS,
        settingsDS,
        thesauriDS,
        translationsDS,
      });

    return {
      entitiesDS,
      entitiesService: EntitiesServiceFactory.default(),
      templatesDS,
      settingsDS,
      propertyAssignmentCreatorServiceStrategy,
      transactionManager,
    };
  }
}

export { MultiUpdateEntityUseCaseFactory };
