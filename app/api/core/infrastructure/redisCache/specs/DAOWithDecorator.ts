import { Cached } from 'api/core/libs/cache/Decorators';
import { Db, ObjectId } from 'mongodb';
import { CacheService } from 'api/core/libs/cache/CacheService';
import { MongoDataSource } from '../../mongodb/common/MongoDataSource';
import { MongoTransactionManager } from '../../mongodb/common/MongoTransactionManager';

class DataAccessObjectWithDecorator extends MongoDataSource {
  protected collectionName = 'entities';

  constructor(
    db: Db,
    transactionManager: MongoTransactionManager,
    private cache: CacheService
  ) {
    super(db, transactionManager);
  }

  @Cached({ key: 'all_entities', ttl: 300 })
  async getAll() {
    return this.getCollection().find({}).toArray();
  }

  @Cached({ key: id => `entity_${id}`, ttl: 300 })
  async getById(id: string) {
    return this.getCollection().findOne({ _id: ObjectId.createFromHexString(id) });
  }
}

export { DataAccessObjectWithDecorator };
