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

class MultiUpdateEntityUseCaseFactory {
  static default() {
    const tenant = ExecutionContext.tenant;

    const transactionManager = ExecutionContext.transactionManager as MongoTransactionManager;
    const { eventEmitter } = ExecutionContext;

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

    const entitiesService = EntitiesServiceFactory.default({
      transactionManager,
      entitiesDS,
      eventEmitter,
      settingsDS,
      templatesDS,
    });

    const entityPermissionChecker = new MongoEntityPermissionChecker(
      getConnection(),
      transactionManager
    );

    const useCase = new MultiUpdateEntity(
      {
        entitiesDS,
        entitiesService,
        templatesDS,
        propertyAssignmentCreatorServiceStrategy,
        entityPermissionChecker,
        transactionManager,
      },
      { actor: ExecutionContext.actor, tenant }
    );

    return useCase;
  }
}

export { MultiUpdateEntityUseCaseFactory };
