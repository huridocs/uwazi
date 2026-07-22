import {
  EntitiesQueryService,
  EntitiesQueryServiceDeps,
} from '#api/core/application/EntitiesQueryService.js';
import { User } from '#api/users.v2/model/User.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { MongoEntityPermissionChecker } from '../mongodb/entity/MongoEntityPermissionChecker.js';
import { MongoRelationshipsV1DataSource } from '../mongodb/MongoRelationshipsV1DataSource.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { TemplatesDataSourceFactory } from './TemplatesDataSourceFactory.js';
import { EntitiesDAOFactory } from './EntitiesDAOFactory.js';

type FactoryDeps = Partial<EntitiesQueryServiceDeps> & {
  transactionManager?: MongoTransactionManager;
};

class EntitiesQueryServiceFactory {
  static default(user: User, deps?: FactoryDeps) {
    const transactionManager = deps?.transactionManager ?? TransactionManagerFactory.default();

    return new EntitiesQueryService({
      entityPermissionChecker:
        deps?.entityPermissionChecker ??
        new MongoEntityPermissionChecker(getConnection(), transactionManager),
      settingsDS: deps?.settingsDS ?? SettingsDataSourceFactory.cached({ transactionManager }),
      templatesDS: deps?.templatesDS ?? TemplatesDataSourceFactory.cached({ transactionManager }),
      entityDAO: deps?.entityDAO ?? EntitiesDAOFactory.default({ user, transactionManager }),
      relationshipsDataSource:
        deps?.relationshipsDataSource ??
        new MongoRelationshipsV1DataSource(getConnection(), transactionManager),
    });
  }
}

export { EntitiesQueryServiceFactory };
