import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { ThesauriDataSource } from 'api/core/application/contracts/ThesauriDataSource';
import { MongoThesauriDataSourceV2 } from '../mongodb/thesauri/MongoThesauriDataSourceV2';
import { CachedMongoThesauriDataSource } from '../mongodb/thesauri/CachedMongoThesauriDataSource';

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
