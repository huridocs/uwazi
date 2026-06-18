import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { UsersDataSource } from '#api/core/application/contracts/UsersDataSource.js';
import { MongoUsersDataSource } from '#api/core/infrastructure/mongodb/user/MongoUsersDataSource.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

type Overrides = {
  transactionManager?: TransactionManager;
};

class UsersDataSourceFactory {
  static default(overrides?: Overrides): UsersDataSource {
    const db = getConnection();
    const transactionManager = (
      overrides?.transactionManager
        ? overrides?.transactionManager
        : ExecutionContext.transactionManager
    ) as MongoTransactionManager;

    return new MongoUsersDataSource(db, transactionManager);
  }
}

export { UsersDataSourceFactory };
