import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoFilesDataSource } from './MongoFilesDataSource';

const DefaultFilesDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoFilesDataSource(db, transactionManager);
};

export { DefaultFilesDataSource };
