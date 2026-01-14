import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { MongoSettingsDataSource } from '../mongodb/MongoSettingsDataSource';

export class SettingsDataSourceFactory {
  static default(transactionManager: MongoTransactionManager) {
    const db = getConnection();
    return new MongoSettingsDataSource(db, transactionManager);
  }
}
