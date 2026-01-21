import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoTranslationsDataSource } from '#api/i18n.v2/database/MongoTranslationsDataSource.js';
import { DefaultTranslationsDataSource } from '#api/translations.v2/database/data_source_defaults.js';

const DefaultTranslationsDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoTranslationsDataSource(db, transactionManager);
};

export { DefaultTranslationsDataSource };
