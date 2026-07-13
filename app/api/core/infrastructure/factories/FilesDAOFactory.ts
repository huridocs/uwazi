import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoFilesDAO } from '../mongodb/files/MongoFilesDAO.js';
import { PostgresFilesDAO } from '../postgresql/files/PostgresFilesDAO.js';
import { PostgresTransactionManagerFactory } from './PostgresTransactionManagerFactory.js';
import { PostgresTransactionManager } from '../postgresql/common/PostgresTransactionManager.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

class FilesDAOFactory {
  static default(): MongoFilesDAO {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresFiles) {
      const pgTM = ExecutionContext.postgresTransactionManager as PostgresTransactionManager;

      return new PostgresFilesDAO({
        tenantId: tenant.name,
        pgTransactionManager: pgTM,
      }) as any as MongoFilesDAO;
    }

    return new MongoFilesDAO({
      db: getConnection(),
      transactionManager: TransactionManagerFactory.default(),
    });
  }
}

export { FilesDAOFactory };
