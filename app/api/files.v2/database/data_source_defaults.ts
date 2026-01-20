import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';

import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoFilesDataSource } from '#api/files.v2/database/MongoFilesDataSource.js';

const DefaultFilesDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoFilesDataSource(db, transactionManager);
};

export { DefaultFilesDataSource };
