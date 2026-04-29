import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { MongoThesauriDataSourceV2 } from '../mongodb/thesauri/MongoThesauriDataSourceV2.js';
import { CachedMongoThesauriDataSource } from '../mongodb/thesauri/CachedMongoThesauriDataSource.js';

export class ThesauriDataSourceFactory {
  static default(transactionManager: TransactionManager): ThesauriDataSource {
    const db = getConnection();
    return new MongoThesauriDataSourceV2(db, transactionManager as MongoTransactionManager);
  }

  static cached(transactionManager: TransactionManager): ThesauriDataSource {
    const db = getConnection();
    return new CachedMongoThesauriDataSource(db, transactionManager as MongoTransactionManager);
  }
}
