import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import type { UsersQueryService } from '#api/core/application/contracts/UsersQueryService.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';
import { MongoUsersDAO } from '../mongodb/user/MongoUsersDAO.js';
import { MongoUsersQueryService } from '../mongodb/user/MongoUsersQueryService.js';
import { PostgresUsersDAO } from '../postgresql/user/PostgresUsersDAO.js';
import { PostgresUsersQueryService } from '../postgresql/user/PostgresUsersQueryService.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';
import { resolveUsersBackend } from './usersBackendFlags.js';

class UsersQueryServiceFactory {
  /**
   * Returns the contract, not an implementation type. Callers must not be able to tell
   * which backend answered — that is what the `as any as MongoUsersQueryService` casts this
   * replaces were hiding (D4).
   *
   * The DAO is constructed here rather than taken from UsersDAOFactory: that factory still
   * returns `MongoUsersDAO` with a cast for its legacy shims, and routing through it is how
   * a mixed configuration used to reach a query service as the wrong DAO type.
   */
  static default(): UsersQueryService {
    const tenant = ExecutionContext.currentTenant;

    if (resolveUsersBackend('UsersQueryService') === 'postgres') {
      return new PostgresUsersQueryService({
        usersDAO: new PostgresUsersDAO({
          tenantId: tenant.name,
          pgTransactionManager: ExecutionContext.postgresTransactionManager,
        }),
      });
    }

    return new MongoUsersQueryService({
      dao: new MongoUsersDAO({
        db: getConnection(),
        transactionManager: TransactionManagerFactory.default(),
      }),
    });
  }
}

export { UsersQueryServiceFactory };
