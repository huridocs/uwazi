import { Db } from 'mongodb';
import { MongoTransactionManager } from '../common/MongoTransactionManager';
import { MongoThesauriDataSourceV2 } from './MongoThesauriDataSourceV2';

export class CachedMongoThesauriDataSource extends MongoThesauriDataSourceV2 {
  private cache = new Map<string, any>();

  constructor(db: Db, transactionManager: MongoTransactionManager) {
    super(db, transactionManager);
    transactionManager.onCommitted(async () => {
      this.cache.clear();
    });
  }

  override async getById(id: string) {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    const thesaurus = await super.getById(id);
    this.cache.set(id, thesaurus);
    return thesaurus;
  }
}
