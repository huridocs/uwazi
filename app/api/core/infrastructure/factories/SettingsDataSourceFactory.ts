import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { MongoSettingsDataSource } from '../mongodb/MongoSettingsDataSource.js';
import { CachedMongoSettingsDataSource } from '../mongodb/CachedMongoSettingsDataSource.js';
import { MongoTransactionManager } from '../mongodb/common/MongoTransactionManager.js';
import { PostgresSettingsDataSource } from '../postgresql/settings/PostgresSettingsDataSource.js';
import { CachedPostgresSettingsDataSource } from '../postgresql/settings/CachedPostgresSettingsDataSource.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { IdGeneratorFactory } from './IdGeneratorFactory.js';
import { PostgresTransactionManagerFactory } from './PostgresTransactionManagerFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

type Overrides = { transactionManager?: TransactionManager };

const mongoTransactionManager = (overrides?: Overrides) =>
  (overrides?.transactionManager ??
    (ExecutionContext.getStore()
      ? ExecutionContext.mongoTransactionManager
      : TransactionManagerFactory.mongo())) as MongoTransactionManager;

const mongoSettings = (DataSource: typeof MongoSettingsDataSource, overrides?: Overrides) =>
  new DataSource({
    db: getConnection(),
    transactionManager: mongoTransactionManager(overrides),
  });

const buildPostgresSettingsDataSource = (cached = false) => {
  const tenant = ExecutionContext.currentTenant;
  const pgTransactionManager = ExecutionContext.getStore()
    ? ExecutionContext.postgresTransactionManager
    : PostgresTransactionManagerFactory.default();

  const deps = {
    tenantId: tenant.name,
    mongoDb: getConnection(),
    pgTransactionManager,
    idGenerator: IdGeneratorFactory.default(),
  };

  return cached ? new CachedPostgresSettingsDataSource(deps) : new PostgresSettingsDataSource(deps);
};

export class SettingsDataSourceFactory {
  static default(overrides?: Overrides): SettingsDataSource {
    if (ExecutionContext.currentTenant.featureFlags?.postgresCore) {
      return buildPostgresSettingsDataSource();
    }

    return mongoSettings(MongoSettingsDataSource, overrides);
  }

  static cached(overrides?: Overrides): SettingsDataSource {
    if (ExecutionContext.currentTenant.featureFlags?.postgresCore) {
      return buildPostgresSettingsDataSource(true);
    }

    return mongoSettings(CachedMongoSettingsDataSource, overrides);
  }
}
