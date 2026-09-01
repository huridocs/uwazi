import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { PostgresPageReleasesDataSource } from '#api/core/infrastructure/postgresql/page/PostgresPageReleasesDataSource.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PageReleasesDataSource } from '#api/pages.v2/application/contracts/PageReleasesDataSource.js';
import { MongoPageReleasesDataSource } from '../mongodb/MongoPageReleasesDataSource.js';

type Overrides = { transactionManager?: TransactionManager };

export class PageReleasesDataSourceFactory {
  static default(overrides?: Overrides): PageReleasesDataSource {
    const db = getConnection();
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresPages) {
      return new PostgresPageReleasesDataSource({
        tenantId: tenant.name,
        mongoDb: db,
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
        idGenerator: IdGeneratorFactory.default(),
      });
    }

    const tm = (overrides?.transactionManager ??
      ExecutionContext.transactionManager) as MongoTransactionManager;
    return new MongoPageReleasesDataSource(db, tm);
  }
}
