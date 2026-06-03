import { Db, Filter, ObjectId } from 'mongodb';
import { MongoDataSource } from '../common/MongoDataSource.js';
import { MongoTransactionManager } from '../common/MongoTransactionManager.js';
import { ThesaurusDBO } from './ThesaurusDBO.js';

type Deps = {
  db: Db;
  transactionManager: MongoTransactionManager;
};

class MongoThesauriDAO extends MongoDataSource<ThesaurusDBO> {
  protected collectionName = 'dictionaries';

  constructor(deps: Deps) {
    super(deps.db, deps.transactionManager);
  }

  async get(query?: { _id?: string }): Promise<ThesaurusDBO[]> {
    const filter: Filter<ThesaurusDBO> = {};
    if (query?._id) {
      filter._id = new ObjectId(query._id);
    }
    return this.getCollection().find(filter).toArray();
  }
}

export { MongoThesauriDAO };
