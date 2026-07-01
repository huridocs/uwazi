import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoFilesDAO } from '../mongodb/files/MongoFilesDAO.js';
import { PostgresFilesDAO } from '../postgresql/files/PostgresFilesDAO.js';
import { PostgresConnectionFactory } from './PostgresConnectionFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

class FilesDAOFactory {
  static default(): MongoFilesDAO {
    const { tenant } = ExecutionContext;

    if (tenant.featureFlags?.postgresFiles) {
      return new PostgresFilesDAO({
        connection: PostgresConnectionFactory.connectionConfig(),
        tenantId: tenant.name,
      }) as any as MongoFilesDAO;
    }

    return new MongoFilesDAO({
      db: getConnection(),
      transactionManager: TransactionManagerFactory.default(),
    });
  }
}

export { FilesDAOFactory };
