import {
  EntitiesQueryService,
  EntitiesQueryServiceDeps,
} from '#api/core/application/EntitiesQueryService.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { MongoEntityPermissionChecker } from '../mongodb/entity/MongoEntityPermissionChecker.js';
import { MongoEntityDAO } from '../mongodb/entity/MongoEntityDAO.js';
import { MongoRelationshipsV1DataSource } from '../mongodb/MongoRelationshipsV1DataSource.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { TemplatesDataSourceFactory } from './TemplatesDataSourceFactory.js';

type FactoryDeps = Partial<EntitiesQueryServiceDeps> & {
  transactionManager?: MongoTransactionManager;
};

class EntitiesQueryServiceFactory {
  static default(deps?: FactoryDeps) {
    const transactionManager = deps?.transactionManager ?? TransactionManagerFactory.default();

    const entityPermissionChecker =
      deps?.entityPermissionChecker ??
      new MongoEntityPermissionChecker(
        getConnection(),
        transactionManager as MongoTransactionManager
      );

    const settingsDS =
      deps?.settingsDS ??
      SettingsDataSourceFactory.cached(transactionManager as MongoTransactionManager);

    const templatesDS =
      deps?.templatesDS ??
      TemplatesDataSourceFactory.cached(transactionManager as MongoTransactionManager);

    const entityDAO =
      deps?.entityDAO ??
      new MongoEntityDAO(getConnection(), transactionManager as MongoTransactionManager);

    const relationshipsDataSource =
      deps?.relationshipsDataSource ??
      new MongoRelationshipsV1DataSource(
        getConnection(),
        transactionManager as MongoTransactionManager
      );

    return new EntitiesQueryService({
      entityPermissionChecker,
      settingsDS,
      templatesDS,
      entityDAO,
      relationshipsDataSource,
    });
  }
}

export { EntitiesQueryServiceFactory };
