import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoSettingsDataSource } from './MongoSettingsDataSource';

const DefaultSettingsDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoSettingsDataSource(db, transactionManager);
};

export { DefaultSettingsDataSource };
