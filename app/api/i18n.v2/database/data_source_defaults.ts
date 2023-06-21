import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoTranslationsDataSource } from './MongoTranslationsDataSource';

const DefaultTranslationsDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoTranslationsDataSource(db, transactionManager);
};

export { DefaultTranslationsDataSource };
