import { PropertyAssignmentCreatorServiceStrategy } from 'api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { CachedTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants/tenantContext';
import { DenormalizeThesaurusEntitiesUseCase } from 'api/core/application/DenormalizeThesaurusEntities';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory';
import { EntitiesDataSourceFactory } from './EntitiesDataSourceFactory';

class DenormalizeThesaurusEntitiesUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const tenant = tenants.current();

    const settingsDS = SettingsDataSourceFactory.cached(transactionManager);
    const thesauriDS = ThesauriDataSourceFactory.cached(transactionManager);
    const entitiesDS = EntitiesDataSourceFactory.default(transactionManager);
    const translationsDS = CachedTranslationsDataSource(transactionManager);

    const propertyAssignmentCreatorServiceStrategy =
      PropertyAssignmentCreatorServiceStrategy.create({
        entitiesDS,
        settingsDS,
        thesauriDS,
        translationsDS,
      });

    const useCase = new DenormalizeThesaurusEntitiesUseCase(
      {
        propertyAssignmentCreatorServiceStrategy,
        transactionManager,
        entitiesDS,
      },
      { actor: permissionsContext.getUserInContext()!, tenant }
    );

    return useCase;
  }
}

export { DenormalizeThesaurusEntitiesUseCaseFactory };
