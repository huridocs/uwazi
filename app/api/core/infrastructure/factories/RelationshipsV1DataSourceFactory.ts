import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoRelationshipsV1DataSource } from '#api/core/infrastructure/mongodb/MongoRelationshipsV1DataSource.js';
import { PostgresRelationshipsV1DataSource } from '#api/core/infrastructure/postgresql/relationships/PostgresRelationshipsV1DataSource.js';
import type { RelationshipsV1DataSource } from '#shared/contracts/RelationshipsV1DataSource.js';
import { EntitiesDAOFactory } from './EntitiesDAOFactory.js';
import { SettingsDataSourceFactory } from './SettingsDataSourceFactory.js';
import { TransactionManagerFactory } from './TransactionManagerFactory.js';

export class RelationshipsV1DataSourceFactory {
  static default(): RelationshipsV1DataSource {
    const db = getConnection();
    // currentTenant falls back to tenants.current() for legacy call sites outside EC
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresCore) {
      const pgTransactionManager = ExecutionContext.getStore()
        ? ExecutionContext.postgresTransactionManager
        : TransactionManagerFactory.postgres();

      return new PostgresRelationshipsV1DataSource({
        tenantId: tenant.name,
        mongoDb: db,
        pgTransactionManager,
        entitiesDAO: EntitiesDAOFactory.default(),
        settingsDS: SettingsDataSourceFactory.default(),
      });
    }

    const transactionManager = ExecutionContext.getStore()
      ? ExecutionContext.mongoTransactionManager
      : TransactionManagerFactory.mongo();

    return new MongoRelationshipsV1DataSource(
      db,
      transactionManager,
      EntitiesDAOFactory.default(),
      SettingsDataSourceFactory.default()
    );
  }
}
