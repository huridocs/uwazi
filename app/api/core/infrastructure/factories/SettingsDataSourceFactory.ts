import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { MongoSettingsDataSource } from '../mongodb/MongoSettingsDataSource.js';
import { CachedMongoSettingsDataSource } from '../mongodb/CachedMongoSettingsDataSource.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

type Overrides = { transactionManager?: TransactionManager };

const resolveTransactionManager = (overrides?: Overrides): MongoTransactionManager =>
  (overrides?.transactionManager ??
    (ExecutionContext.getStore()
      ? ExecutionContext.transactionManager
      : TransactionManagerFactory.default())) as MongoTransactionManager;

export class SettingsDataSourceFactory {
  static default(overrides?: Overrides): SettingsDataSource {
    return new MongoSettingsDataSource({
      db: getConnection(),
      transactionManager: resolveTransactionManager(overrides),
    });
  }

  static cached(overrides?: Overrides): SettingsDataSource {
    return new CachedMongoSettingsDataSource({
      db: getConnection(),
      transactionManager: resolveTransactionManager(overrides),
    });
  }
}
