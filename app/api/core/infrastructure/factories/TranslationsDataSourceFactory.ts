import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { TranslationsDataSource } from '#api/core/application/contracts/TranslationsDataSource.js';
import { MongoTranslationsDataSource } from '../mongodb/translation/MongoTranslationsDataSource.js';
import { CachedMongoTranslationsDataSource } from '../mongodb/translation/CachedMongoTranslationsDataSource.js';
import { PostgresTranslationsDataSource } from '../postgresql/translation/PostgresTranslationsDataSource.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { IdGeneratorFactory } from './IdGeneratorFactory.js';

type Overrides = { transactionManager?: TransactionManager };

export class TranslationsDataSourceFactory {
  static default(overrides?: Overrides): TranslationsDataSource {
    const db = getConnection();
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresTranslations) {
      return new PostgresTranslationsDataSource({
        tenantId: tenant.name,
        mongoDb: db,
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
        idGenerator: IdGeneratorFactory.default(),
      });
    }

    const tm = (overrides?.transactionManager ??
      ExecutionContext.transactionManager) as MongoTransactionManager;
    return new MongoTranslationsDataSource(db, tm);
  }

  static cached(overrides?: Overrides): TranslationsDataSource {
    const db = getConnection();
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresTranslations) {
      return new PostgresTranslationsDataSource({
        tenantId: tenant.name,
        mongoDb: db,
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
        idGenerator: IdGeneratorFactory.default(),
      });
    }

    const tm = (overrides?.transactionManager ??
      ExecutionContext.transactionManager) as MongoTransactionManager;
    return new CachedMongoTranslationsDataSource(db, tm);
  }
}
