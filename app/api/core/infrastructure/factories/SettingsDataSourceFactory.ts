import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoSettingsDataSource } from '#api/core/infrastructure/mongodb/MongoSettingsDataSource.js';
import { CachedMongoSettingsDataSource } from '#api/core/infrastructure/mongodb/CachedMongoSettingsDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';

export class SettingsDataSourceFactory {
  static default(transactionManager: MongoTransactionManager): SettingsDataSource {
    const db = getConnection();
    return new MongoSettingsDataSource(db, transactionManager);
  }

  static cached(transactionManager: MongoTransactionManager): SettingsDataSource {
    const db = getConnection();
    return new CachedMongoSettingsDataSource(db, transactionManager);
  }
}
