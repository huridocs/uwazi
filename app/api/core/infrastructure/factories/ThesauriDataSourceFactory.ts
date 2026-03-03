import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { MongoThesauriDataSourceV2 } from '../mongodb/thesauri/MongoThesauriDataSourceV2.js';
import { CachedMongoThesauriDataSource } from '../mongodb/thesauri/CachedMongoThesauriDataSource.js';

export class ThesauriDataSourceFactory {
  static default(transactionManager: MongoTransactionManager): ThesauriDataSource {
    const db = getConnection();
    return new MongoThesauriDataSourceV2(db, transactionManager);
  }

  static cached(transactionManager: MongoTransactionManager): ThesauriDataSource {
    const db = getConnection();
    return new CachedMongoThesauriDataSource(db, transactionManager);
  }
}
