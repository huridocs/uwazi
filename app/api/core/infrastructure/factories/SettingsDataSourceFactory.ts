import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { MongoSettingsDataSource } from '../mongodb/MongoSettingsDataSource.js';
import { CachedMongoSettingsDataSource } from '../mongodb/CachedMongoSettingsDataSource.js';

export class SettingsDataSourceFactory {
  static default(transactionManager: TransactionManager): SettingsDataSource {
    const db = getConnection();
    return new MongoSettingsDataSource(db, transactionManager as MongoTransactionManager);
  }

  static cached(transactionManager: TransactionManager): SettingsDataSource {
    const db = getConnection();
    return new CachedMongoSettingsDataSource(db, transactionManager as MongoTransactionManager);
  }
}
