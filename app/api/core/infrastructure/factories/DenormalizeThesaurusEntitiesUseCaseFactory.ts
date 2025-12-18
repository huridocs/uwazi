import { PropertyAssignmentCreatorServiceStrategy } from 'api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { tenants } from 'api/tenants/tenantContext';
import { DenormalizeThesaurusEntitiesUseCase } from 'api/core/application/DenormalizeThesaurusEntities';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant';
import { MongoThesauriDataSourceV2 } from '../mongodb/thesauri/MongoThesaurusDataSourceV2';

class DenormalizeThesaurusEntitiesUseCaseFactory {
  static default() {
    const transactionManager = TransactionManagerFactory.default();
    const tenant = tenants.current();
    const settingsDS = SettingsDataSourceFactory.default(transactionManager);
    const thesauriDS = new MongoThesauriDataSourceV2(getConnection(), transactionManager);
    const translationsDS = DefaultTranslationsDataSource(transactionManager);
    const entitiesDS = new MongoMultiLanguageEntityDataSource(getConnection(), transactionManager);

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
