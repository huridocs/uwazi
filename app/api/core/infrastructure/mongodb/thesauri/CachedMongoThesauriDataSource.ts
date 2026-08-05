import { Db } from 'mongodb';
import { MongoTransactionManager } from '../common/MongoTransactionManager.js';
import { MongoThesauriDataSource } from './MongoThesauriDataSource.js';

export class CachedMongoThesauriDataSource extends MongoThesauriDataSource {
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
