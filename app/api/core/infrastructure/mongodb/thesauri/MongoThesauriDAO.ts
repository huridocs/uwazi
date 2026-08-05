import { Db, ObjectId } from 'mongodb';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoDataSource } from '../common/MongoDataSource.js';
import { ThesaurusDBO } from './ThesaurusDBO.js';

type Deps = {
  db: Db;
  transactionManager: TransactionManager;
};

class MongoThesauriDAO extends MongoDataSource<ThesaurusDBO> {
  protected collectionName = 'dictionaries';

  constructor(deps: Deps) {
    super(deps.db, deps.transactionManager);
  }

  async get(ids?: string[]): Promise<ThesaurusDBO[]> {
    if (ids && ids.length) {
      const objectIds = ids.map(id => new ObjectId(id));
      return this.getCollection()
        .find({ _id: { $in: objectIds } })
        .toArray();
    }
    return this.getCollection().find({}).toArray();
  }
}

export { MongoThesauriDAO };
