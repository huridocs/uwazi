import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { MongoSettingsDataSource } from '../mongodb/MongoSettingsDataSource.js';
import { CachedMongoSettingsDataSource } from '../mongodb/CachedMongoSettingsDataSource.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

type Overrides = { transactionManager?: TransactionManager };

export class SettingsDataSourceFactory {
  static default(overrides?: Overrides): SettingsDataSource {
    return new MongoSettingsDataSource({
      db: getConnection(),
      transactionManager: (overrides?.transactionManager ??
        ExecutionContext.transactionManager) as MongoTransactionManager,
    });
  }

  static cached(overrides?: Overrides): SettingsDataSource {
    return new CachedMongoSettingsDataSource({
      db: getConnection(),
      transactionManager: (overrides?.transactionManager ??
        ExecutionContext.transactionManager) as MongoTransactionManager,
    });
  }
}
