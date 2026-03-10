import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { SettingsDataSource } from 'api/core/application/contracts/SettingsDataSource';
import { MongoSettingsDataSource } from '../mongodb/MongoSettingsDataSource';
import { CachedMongoSettingsDataSource } from '../mongodb/CachedMongoSettingsDataSource';

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
