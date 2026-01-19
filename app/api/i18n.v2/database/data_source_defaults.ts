import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { MongoTranslationsDataSource } from './MongoTranslationsDataSource';
import { CachedMongoTranslationsDataSource } from './CachedMongoTranslationsDataSource';
import { TranslationsDataSource } from '../contracts/TranslationsDataSource';

const DefaultTranslationsDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoTranslationsDataSource(db, transactionManager);
};

const CachedTranslationsDataSource = (
  transactionManager: MongoTransactionManager
): TranslationsDataSource => {
  const db = getConnection();
  return new CachedMongoTranslationsDataSource(db, transactionManager);
};

export { DefaultTranslationsDataSource, CachedTranslationsDataSource };
