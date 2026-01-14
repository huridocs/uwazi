import { getConnection } from '#api/common.v2/database/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/common.v2/database/MongoTransactionManager.js';
import { MongoPermissionsDataSource } from './MongoPermissionsDataSource';
import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';

const DefaultPermissionsDataSource = (_transactionManager?: MongoTransactionManager) => {
  const connection = getConnection();
  const transactionManager = _transactionManager || TransactionManagerFactory.default();
  return new MongoPermissionsDataSource(connection, transactionManager);
};

export { DefaultPermissionsDataSource };
