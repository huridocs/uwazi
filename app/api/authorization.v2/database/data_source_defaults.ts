import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoPermissionsDataSource } from '#api/authorization.v2/database/MongoPermissionsDataSource.js';
import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';

const DefaultPermissionsDataSource = (_transactionManager?: MongoTransactionManager) => {
  const connection = getConnection();
  const transactionManager = _transactionManager || TransactionManagerFactory.default();
  return new MongoPermissionsDataSource(connection, transactionManager);
};

export { DefaultPermissionsDataSource };
