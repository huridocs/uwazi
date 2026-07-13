import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { MongoThesauriDataSource } from '../mongodb/thesauri/MongoThesauriDataSource.js';
import { CachedMongoThesauriDataSource } from '../mongodb/thesauri/CachedMongoThesauriDataSource.js';
import { PostgresThesauriDataSource } from '../postgresql/thesaurus/PostgresThesauriDataSource.js';
import { PostgresTransactionManagerFactory } from './PostgresTransactionManagerFactory.js';
import { PostgresTransactionManager } from '../postgresql/common/PostgresTransactionManager.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

type Overrides = { transactionManager?: TransactionManager };

export class ThesauriDataSourceFactory {
  static default(overrides?: Overrides): ThesauriDataSource {
    const db = getConnection();
    const { tenant } = ExecutionContext;

    if (tenant.featureFlags?.postgresThesauri) {
      const pgTM = ExecutionContext.postgresTransactionManager as PostgresTransactionManager;

      return new PostgresThesauriDataSource({
        tenantId: tenant.name,
        mongoDb: db,
        pgTransactionManager: pgTM,
      });
    }

    const tm = (overrides?.transactionManager ??
      ExecutionContext.transactionManager) as MongoTransactionManager;
    return new MongoThesauriDataSource(db, tm);
  }

  static cached(overrides?: Overrides): ThesauriDataSource {
    const db = getConnection();
    const { tenant } = ExecutionContext;

    if (tenant.featureFlags?.postgresThesauri) {
      const pgTM = ExecutionContext.postgresTransactionManager as PostgresTransactionManager;

      return new PostgresThesauriDataSource({
        tenantId: tenant.name,
        mongoDb: db,
        pgTransactionManager: pgTM,
      });
    }

    const tm = (overrides?.transactionManager ??
      ExecutionContext.transactionManager) as MongoTransactionManager;
    return new CachedMongoThesauriDataSource(db, tm);
  }
}
