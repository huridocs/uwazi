import { PropertyAssignmentCreatorServiceStrategy } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { CachedTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { DenormalizeThesaurusEntitiesUseCase } from '#api/core/application/DenormalizeThesaurusEntities.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory.js';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory.js';

class DenormalizeThesaurusEntitiesUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof DenormalizeThesaurusEntitiesUseCase>[0]>
  ) {
    const transactionManager = TransactionManagerFactory.default();

    const settingsDS = SettingsDataSourceFactory.cached({ transactionManager });
    const thesauriDS = ThesauriDataSourceFactory.cached({ transactionManager });
    const entitiesDS = EntitiesDataSourceFactory.default({ transactionManager });
    const translationsDS = CachedTranslationsDataSource(transactionManager);

    const propertyAssignmentCreatorServiceStrategy =
      PropertyAssignmentCreatorServiceStrategy.create({
        entitiesDS,
        settingsDS,
        thesauriDS,
        translationsDS,
      });

    return new DenormalizeThesaurusEntitiesUseCase(
      {
        propertyAssignmentCreatorServiceStrategy,
        transactionManager,
        entitiesDS,
        ...overrides,
      },
      { actor: ExecutionContext.actor, tenant: ExecutionContext.tenant }
    );
  }
}

export { DenormalizeThesaurusEntitiesUseCaseFactory };
