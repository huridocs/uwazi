import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoPermissionsDataSource } from './MongoPermissionsDataSource';

const DefaultPermissionsDataSource = (transactionManager: MongoTransactionManager) => {
  const connection = getConnection();
  return new MongoPermissionsDataSource(connection, transactionManager);
};

export { DefaultPermissionsDataSource };
