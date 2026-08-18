import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoUsersDAO } from '../mongodb/user/MongoUsersDAO.js';
import { PostgresUsersDAO } from '../postgresql/user/PostgresUsersDAO.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

class UsersDAOFactory {
  static default(): MongoUsersDAO {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresUsers) {
      return new PostgresUsersDAO({
        tenantId: tenant.name,
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
      }) as any as MongoUsersDAO;
    }

    return new MongoUsersDAO({
      db: getConnection(),
      transactionManager: TransactionManagerFactory.default(),
    });
  }
}

export { UsersDAOFactory };
