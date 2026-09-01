import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { PostgresPagesDataSource } from '#api/core/infrastructure/postgresql/page/PostgresPagesDataSource.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { PagesDataSource } from '#api/pages.v2/application/contracts/PagesDataSource.js';
import { MongoPagesDataSource } from '../mongodb/MongoPagesDataSource.js';

type Overrides = { transactionManager?: TransactionManager };

export class PagesDataSourceFactory {
  static default(overrides?: Overrides): PagesDataSource {
    const db = getConnection();
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresPages) {
      return new PostgresPagesDataSource({
        tenantId: tenant.name,
        mongoDb: db,
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
      });
    }

    const tm = (overrides?.transactionManager ??
      ExecutionContext.transactionManager) as MongoTransactionManager;
    return new MongoPagesDataSource(db, tm);
  }
}
