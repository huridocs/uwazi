import { getConnection } from '../../common.v2/database/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '../../common.v2/database/MongoTransactionManager.js';
import { MongoTemplatesDataSource } from './MongoTemplatesDataSource.js';

const DefaultTemplatesDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoTemplatesDataSource(db, transactionManager);
};

export { DefaultTemplatesDataSource };
