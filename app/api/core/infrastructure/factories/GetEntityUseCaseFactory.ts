import { TransactionManagerFactory } from './TransactionManagerFactory.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoEntityDAO } from '../mongodb/entity/MongoEntityDAO.js';
import { MongoRelationshipsV1DataSource } from '../mongodb/MongoRelationshipsV1DataSource.js';
import { FilesDataSourceFactory } from './FilesDataSourceFactory.js';
import { GetEntityUseCase } from '../../application/GetEntity.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { MongoEntityPermissionChecker } from '../mongodb/entity/MongoEntityPermissionChecker.js';
import { TemplatesDataSourceFactory } from './TemplatesDataSourceFactory.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';

export class GetEntityUseCaseFactory {
  static default(targetLanguage?: LanguageISO6391) {
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

    const filesDataSource = FilesDataSourceFactory.default(
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

    const actor = permissionsContext.getUserInContext();

    const useCase = new GetEntityUseCase(
      {
        entityDAO,
        relationshipsDataSource,
        filesDataSource,
        permissionChecker,
        templatesDataSource,
        settingsDataSource,
      },
      actor ? { actor, tenant, targetLanguage } : undefined
    );

    return useCase;
  }
}
