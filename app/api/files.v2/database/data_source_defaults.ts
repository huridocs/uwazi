import { getConnection } from '../common.v2/database/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '../common.v2/database/MongoTransactionManager.js';
import { MongoFilesDataSource } from './MongoFilesDataSource';

const DefaultFilesDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoFilesDataSource(db, transactionManager);
};

export { DefaultFilesDataSource };
