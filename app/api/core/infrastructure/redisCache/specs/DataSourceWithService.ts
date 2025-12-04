import { Db, ObjectId } from 'mongodb';
import { CacheService } from 'api/core/libs/cache/CacheService';
import { MongoDataSource } from '../../mongodb/common/MongoDataSource';
import { MongoTransactionManager } from '../../mongodb/common/MongoTransactionManager';

class DataSourceWithService extends MongoDataSource {
  protected collectionName = 'entities';

  constructor(
    db: Db,
    transactionManager: MongoTransactionManager,
    private cache: CacheService
  ) {
    super(db, transactionManager);
  }

  async getAll() {
    const cache = await this.cache.get('all_entities');
    if (cache) {
      return cache;
    }

    const dbo = await this.getCollection().find({}).toArray();
    await this.cache.set('all_entities', dbo);
  }

  async getById(id: string) {
    const cache = await this.cache.get(`entity_${id}`);
    if (cache) {
      return cache;
    }

    const dbo = await this.getCollection().findOne({ _id: ObjectId.createFromHexString(id) });
    await this.cache.set(`entity_${id}`, dbo);

    return dbo;
  }
}

export { DataSourceWithService };
