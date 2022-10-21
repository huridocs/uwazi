import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoUserDataSource } from './MongoUserDataSource';

const DefaultUserDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoUserDataSource(db, transactionManager);
};

export { DefaultUserDataSource };
