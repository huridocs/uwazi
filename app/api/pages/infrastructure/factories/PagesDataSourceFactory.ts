import { PagesDataSource } from '#api/pages/application/contracts/PagesDataSource.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoPagesDataSource } from '../mongodb/MongoPagesDataSource.js';

type Overrides = { transactionManager?: TransactionManager };

export class PagesDataSourceFactory {
  static default(overrides?: Overrides): MongoPagesDataSource {
    const db = getConnection();
    const tm = (overrides?.transactionManager ??
      ExecutionContext.transactionManager) as MongoTransactionManager;
    return new MongoPagesDataSource(db, tm);
  }
}
