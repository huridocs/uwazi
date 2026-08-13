import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { TranslationsDataSource } from '#api/core/application/contracts/TranslationsDataSource.js';
import { MongoTranslationsDataSource } from '../mongodb/translation/MongoTranslationsDataSource.js';
import { CachedMongoTranslationsDataSource } from '../mongodb/translation/CachedMongoTranslationsDataSource.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

type Overrides = { transactionManager?: TransactionManager };

export class TranslationsDataSourceFactory {
  static default(overrides?: Overrides): TranslationsDataSource {
    const db = getConnection();
    const tm = (overrides?.transactionManager ??
      ExecutionContext.transactionManager) as MongoTransactionManager;
    return new MongoTranslationsDataSource(db, tm);
  }

  static cached(overrides?: Overrides): TranslationsDataSource {
    const db = getConnection();
    const tm = (overrides?.transactionManager ??
      ExecutionContext.transactionManager) as MongoTransactionManager;
    return new CachedMongoTranslationsDataSource(db, tm);
  }
}
