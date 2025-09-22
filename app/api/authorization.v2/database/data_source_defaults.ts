import { DefaultTransactionManager } from '../common.v2/database/data_source_defaults.js';
import { getConnection } from '../common.v2/database/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '../common.v2/database/MongoTransactionManager.js';
import { MongoPermissionsDataSource } from './MongoPermissionsDataSource';

const DefaultPermissionsDataSource = (_transactionManager?: MongoTransactionManager) => {
  const connection = getConnection();
  const transactionManager = _transactionManager || DefaultTransactionManager();
  return new MongoPermissionsDataSource(connection, transactionManager);
};

export { DefaultPermissionsDataSource };
