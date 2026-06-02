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
import { MongoEntityPermissionChecker } from '../mongodb/entity/MongoEntityPermissionChecker.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { User } from '#api/users.v2/model/User.js';

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

    const entityPermissionChecker = new MongoEntityPermissionChecker(
      getConnection(),
      transactionManager
    );

    let actor: User | undefined;
    try {
      actor = ExecutionContext.actor;
    } catch {
      // still needed for some backwards compat tests
      actor = User.createFrom(permissionsContext.getUserInContext()!);
    }

    const useCase = new MultiUpdateEntity(
      {
        entitiesDS,
        entitiesService,
        templatesDS,
        propertyAssignmentCreatorServiceStrategy,
        entityPermissionChecker,
        transactionManager,
      },
      { actor, tenant }
    );

    return useCase;
  }
}

export { MultiUpdateEntityUseCaseFactory };
