import { getConnection } from '../../common.v2/database/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '../../common.v2/database/MongoTransactionManager.js';
import { MongoSettingsDataSource } from './MongoSettingsDataSource.js';

const DefaultSettingsDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  // @ts-expect-error TS(2554): Expected 0 arguments, but got 2.
  return new MongoSettingsDataSource(db, transactionManager);
};

export { DefaultSettingsDataSource };
