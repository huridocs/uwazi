import { PostgresTemplatesDAO } from '#api/core/infrastructure/postgresql/template/PostgresTemplatesDAO.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTemplatesDAO } from '../mongodb/template/MongoTemplatesDAO.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

class TemplatesDAOFactory {
  static default(): MongoTemplatesDAO | PostgresTemplatesDAO {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresCore) {
      const pgTM = ExecutionContext.postgresTransactionManager;

      return new PostgresTemplatesDAO({
        tenantId: tenant.name,
        mongoDb: getConnection(),
        pgTransactionManager: pgTM,
      });
    }

    return new MongoTemplatesDAO({
      db: getConnection(),
      transactionManager: ExecutionContext.getStore()
        ? ExecutionContext.transactionManager
        : TransactionManagerFactory.mongo(),
    });
  }
}

export { TemplatesDAOFactory };
