import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { MongoSettingsDataSource } from '../mongodb/MongoSettingsDataSource';

const DefaultSettingsDataSource = (transactionManager: MongoTransactionManager) => {
  const db = getConnection();
  return new MongoSettingsDataSource(db, transactionManager);
};

export { DefaultSettingsDataSource };

export class MongoSettingsDataSourceFactory {
  static default(transactionManager: MongoTransactionManager) {
    const db = getConnection();
    return new MongoSettingsDataSource(db, transactionManager);
  }
}
