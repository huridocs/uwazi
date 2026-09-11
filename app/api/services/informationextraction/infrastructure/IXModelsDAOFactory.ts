import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { isPostgresCoreActive } from '#api/core/libs/featureFlags.js';
import { IXModelsDataSource } from '../domain/IXModelsDataSource.js';
import {
  mongoTransactionManager,
  postgresTransactionManager,
} from './contextTransactionManagers.js';
import { MongoIXModelsDataSource } from './MongoIXModelsDataSource.js';
import { PostgresIXModelsDataSource } from './PostgresIXModelsDataSource.js';

class IXModelsDAOFactory {
  static default(): IXModelsDataSource {
    if (isPostgresCoreActive()) {
      return new PostgresIXModelsDataSource({
        tenantId: ExecutionContext.currentTenant.name,
        pgTransactionManager: postgresTransactionManager(),
      });
    }

    return new MongoIXModelsDataSource({
      db: getConnection(),
      transactionManager: mongoTransactionManager(),
    });
  }
}

export { IXModelsDAOFactory };
