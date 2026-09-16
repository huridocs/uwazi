import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { isPostgresCoreActive } from '#api/core/libs/featureFlags.js';
import { IXExtractorsDataSource } from '../domain/IXExtractorsDataSource.js';
import {
  mongoTransactionManager,
  postgresTransactionManager,
} from './contextTransactionManagers.js';
import { MongoIXExtractorsDataSource } from './MongoIXExtractorsDataSource.js';
import { PostgresIXExtractorsDataSource } from './PostgresIXExtractorsDataSource.js';

class IXExtractorsDAOFactory {
  static default(): IXExtractorsDataSource {
    if (isPostgresCoreActive()) {
      return new PostgresIXExtractorsDataSource({
        tenantId: ExecutionContext.currentTenant.name,
        pgTransactionManager: postgresTransactionManager(),
      });
    }

    return new MongoIXExtractorsDataSource({
      db: getConnection(),
      transactionManager: mongoTransactionManager(),
    });
  }
}

export { IXExtractorsDAOFactory };
