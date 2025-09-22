import { getConnection } from '../../common.v2/database/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '../../common.v2/database/MongoTransactionManager.js';
import { MongoSettingsDataSource } from './MongoSettingsDataSource.js';

const DefaultSettingsDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoSettingsDataSource(db, transactionManager);
};

export { DefaultSettingsDataSource };
