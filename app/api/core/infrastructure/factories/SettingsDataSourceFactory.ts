import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { MongoSettingsDataSource } from '../mongodb/MongoSettingsDataSource.js';
import { CachedMongoSettingsDataSource } from '../mongodb/CachedMongoSettingsDataSource.js';
import { PostgresSettingsDataSource } from '../postgresql/settings/PostgresSettingsDataSource.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { IdGeneratorFactory } from './IdGeneratorFactory.js';
import { PostgresTransactionManagerFactory } from './PostgresTransactionManagerFactory.js';

type Overrides = { transactionManager?: TransactionManager };

const mongoSettings = (DataSource: typeof MongoSettingsDataSource, overrides?: Overrides) =>
  new DataSource({
    db: getConnection(),
    transactionManager: (overrides?.transactionManager ??
      ExecutionContext.transactionManager) as MongoTransactionManager,
  });

const buildPostgresSettingsDataSource = () => {
  const tenant = ExecutionContext.currentTenant;
  const pgTransactionManager = ExecutionContext.getStore()
    ? ExecutionContext.postgresTransactionManager
    : PostgresTransactionManagerFactory.default();

  return new PostgresSettingsDataSource({
    tenantId: tenant.name,
    mongoDb: getConnection(),
    pgTransactionManager,
    idGenerator: IdGeneratorFactory.default(),
  });
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
      return buildPostgresSettingsDataSource();
    }

    return mongoSettings(CachedMongoSettingsDataSource, overrides);
  }
}
