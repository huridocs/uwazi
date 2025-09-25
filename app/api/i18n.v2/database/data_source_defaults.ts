import { getConnection } from '#api/common.v2/database/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/common.v2/database/MongoTransactionManager.js';
import { MongoTranslationsDataSource } from './MongoTranslationsDataSource.js';

const DefaultTranslationsDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoTranslationsDataSource(db, transactionManager);
};

export { DefaultTranslationsDataSource };
