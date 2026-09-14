import { Db } from 'mongodb';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoThesauriDataSource } from './MongoThesauriDataSource.js';

export class CachedMongoThesauriDataSource extends MongoThesauriDataSource {
  private cache = new Map<string, any>();

  constructor(db: Db, transactionManager: TransactionManager) {
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
