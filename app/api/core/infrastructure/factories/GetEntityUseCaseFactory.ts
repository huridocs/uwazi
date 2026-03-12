import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { UserSchema } from '#shared/types/userType.js';
import { GetEntityUseCase } from '../../application/GetEntity.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { MongoEntityDAO } from '../mongodb/entity/MongoEntityDAO.js';
import { MongoEntityPermissionChecker } from '../mongodb/entity/MongoEntityPermissionChecker.js';
import { MongoRelationshipsV1DataSource } from '../mongodb/MongoRelationshipsV1DataSource.js';
import { EntitiesQueryServiceFactory } from './EntitiesQueryServiceFactory.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { TemplatesDataSourceFactory } from './TemplatesDataSourceFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

export class GetEntityUseCaseFactory {
  static default(targetLanguage?: LanguageISO6391, actorParam?: UserSchema | null) {
    const tenant = tenants.current();
    const transactionManager = TransactionManagerFactory.default();
    const entityDAO = new MongoEntityDAO(
      getConnection(),
      transactionManager as MongoTransactionManager
    );

    const relationshipsDataSource = new MongoRelationshipsV1DataSource(
      getConnection(),
      transactionManager as MongoTransactionManager
    );

    const permissionChecker = new MongoEntityPermissionChecker(
      getConnection(),
      transactionManager as MongoTransactionManager
    );

    const templatesDataSource = TemplatesDataSourceFactory.cached(
      transactionManager as MongoTransactionManager
    );

    const settingsDataSource = SettingsDataSourceFactory.cached(
      transactionManager as MongoTransactionManager
    );

    const entitiesQueryService = EntitiesQueryServiceFactory.default({
      transactionManager,
      entityPermissionChecker: permissionChecker,
      templatesDS: templatesDataSource,
      settingsDS: settingsDataSource,
    });

    // If actorParam is null, use undefined. If not provided (undefined), fall back to permissionsContext
    const actor =
      actorParam === null ? undefined : (actorParam ?? permissionsContext.getUserInContext());

    const useCase = new GetEntityUseCase(
      {
        entityDAO,
        relationshipsDataSource,
        entitiesQueryService,
      },
      actor ? { actor, tenant, targetLanguage } : { tenant, targetLanguage }
    );

    return useCase;
  }
}
