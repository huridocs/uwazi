import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoPermissionsDataSource } from './MongoPermissionsDataSource';

const DefaultPermissionsDataSource = (_transactionManager?: MongoTransactionManager) => {
  const connection = getConnection();
  const transactionManager = _transactionManager || DefaultTransactionManager();
  return new MongoPermissionsDataSource(connection, transactionManager);
};

export { DefaultPermissionsDataSource };
