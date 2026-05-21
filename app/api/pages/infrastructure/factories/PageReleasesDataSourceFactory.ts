import { PageReleasesDataSource } from '#api/pages/application/contracts/PageReleasesDataSource.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoPageReleasesDataSource } from '../mongodb/MongoPageReleasesDataSource.js';

type Overrides = { transactionManager?: TransactionManager };

export class PageReleasesDataSourceFactory {
  static default(overrides?: Overrides): MongoPageReleasesDataSource {
    const db = getConnection();
    const tm = (overrides?.transactionManager ??
      ExecutionContext.transactionManager) as MongoTransactionManager;
    return new MongoPageReleasesDataSource(db, tm);
  }
}
