import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { MongoPermissionsDataSource } from './MongoPermissionsDataSource';

const DefaultPermissionsDataSource = (_transactionManager?: MongoTransactionManager) => {
  const connection = getConnection();
  const transactionManager = _transactionManager || TransactionManagerFactory.default();
  return new MongoPermissionsDataSource(connection, transactionManager);
};

export { DefaultPermissionsDataSource };
