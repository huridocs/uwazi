import { PropertyAssignmentCreatorServiceStrategy } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';
import { DenormalizeThesaurusEntitiesUseCase } from '#api/core/application/DenormalizeThesaurusEntities.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory.js';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory.js';
import { EntitiesServiceFactory } from './EntitiesServiceFactory.js';

class DenormalizeThesaurusEntitiesUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof DenormalizeThesaurusEntitiesUseCase>[0]>
  ) {
    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;

    const settingsDS = SettingsDataSourceFactory.cached({ transactionManager });
    const thesauriDS = ThesauriDataSourceFactory.cached({ transactionManager });
    const entitiesDS = EntitiesDataSourceFactory.default({ transactionManager });
    const translationsDS = TranslationsDataSourceFactory.cached({ transactionManager });

    const propertyAssignmentCreatorServiceStrategy =
      PropertyAssignmentCreatorServiceStrategy.create({
        entitiesDS,
        settingsDS,
        thesauriDS,
        translationsDS,
      });

    return new DenormalizeThesaurusEntitiesUseCase(
      {
        settingsDS,
        propertyAssignmentCreatorServiceStrategy,
        transactionManager,
        entitiesDS,
        entitiesService: EntitiesServiceFactory.default(),
        ...overrides,
      },
      { actor: ExecutionContext.actor, tenant: ExecutionContext.tenant }
    );
  }
}

export { DenormalizeThesaurusEntitiesUseCaseFactory };
