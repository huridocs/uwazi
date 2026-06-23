import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UsergroupsDataSource } from '#api/core/application/contracts/UsergroupsDataSource.js';
import { MongoUsergroupsDataSource } from '../mongodb/user/MongoUsergroupsDataSource.js';

type Overrides = {
  transactionManager?: TransactionManager;
};

class UsergroupsDataSourceFactory {
  static default(overrides?: Overrides): UsergroupsDataSource {
    const db = getConnection();
    const transactionManager = (
      overrides?.transactionManager
        ? overrides?.transactionManager
        : ExecutionContext.transactionManager
    ) as MongoTransactionManager;

    return new MongoUsergroupsDataSource(db, transactionManager);
  }
}

export { UsergroupsDataSourceFactory };
