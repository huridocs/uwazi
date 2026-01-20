import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoSettingsDataSource } from '#api/core/infrastructure/mongodb/MongoSettingsDataSource.js';

export class SettingsDataSourceFactory {
  static default(transactionManager: MongoTransactionManager) {
    const db = getConnection();
    return new MongoSettingsDataSource(db, transactionManager);
  }
}
