import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { MongoSettingsDataSource } from '../mongodb/MongoSettingsDataSource.js';
import { CachedMongoSettingsDataSource } from '../mongodb/CachedMongoSettingsDataSource.js';
import { PostgresSettingsDataSource } from '../postgresql/settings/PostgresSettingsDataSource.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

type Overrides = { transactionManager?: TransactionManager };

const mongoSettings = (DataSource: typeof MongoSettingsDataSource, overrides?: Overrides) =>
  new DataSource({
    db: getConnection(),
    transactionManager: (overrides?.transactionManager ??
      ExecutionContext.transactionManager) as MongoTransactionManager,
  });

export class SettingsDataSourceFactory {
  static default(overrides?: Overrides): SettingsDataSource {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresSettings) {
      return new PostgresSettingsDataSource({
        tenantId: tenant.name,
        mongoDb: getConnection(),
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
      });
    }

    return mongoSettings(MongoSettingsDataSource, overrides);
  }

  static cached(overrides?: Overrides): SettingsDataSource {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresSettings) {
      return new PostgresSettingsDataSource({
        tenantId: tenant.name,
        mongoDb: getConnection(),
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
      });
    }

    return mongoSettings(CachedMongoSettingsDataSource, overrides);
  }
}
