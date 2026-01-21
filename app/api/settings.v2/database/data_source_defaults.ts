import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoSettingsDataSource } from '#api/core/infrastructure/mongodb/MongoSettingsDataSource.js';
import { DefaultSettingsDataSource } from '#api/settings.v2/database/data_source_defaults.js';

const DefaultSettingsDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoSettingsDataSource(db, transactionManager);
};

export { DefaultSettingsDataSource };
