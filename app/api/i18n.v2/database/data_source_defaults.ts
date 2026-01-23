import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoTranslationsDataSource } from '#api/i18n.v2/database/MongoTranslationsDataSource.js';
import { CachedMongoTranslationsDataSource } from '#api/i18n.v2/database/CachedMongoTranslationsDataSource.js';
import { TranslationsDataSource } from '#api/i18n.v2/contracts/TranslationsDataSource.js';

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
