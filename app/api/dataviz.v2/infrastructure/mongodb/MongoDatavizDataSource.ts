import { Db, ObjectId } from 'mongodb';
import { DatavizDataSource } from '#api/dataviz.v2/application/contracts/DatavizDataSource.js';
import { Dataviz } from '#api/dataviz.v2/domain/Dataviz.js';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { Result } from '#api/core/libs/Result.js';
import { DatavizDBO } from './DatavizDBO.js';
import { DatavizMapper } from './DatavizMapper.js';

class MongoDatavizDataSource extends MongoDataSource<DatavizDBO> implements DatavizDataSource {
  protected collectionName = 'dataviz';

  constructor(db: Db, transactionManager: MongoTransactionManager) {
    super(db, transactionManager);
  }

  async create(dataviz: Dataviz): Promise<void> {
    const dbo = DatavizMapper.toDBO(dataviz);
    await this.getCollection().insertOne(dbo, { ignoreUndefined: true });
  }

  async update(dataviz: Dataviz): Promise<void> {
    const dbo = DatavizMapper.toDBO(dataviz);
    await this.getCollection().replaceOne({ _id: dbo._id }, dbo, { ignoreUndefined: true });
  }

  async delete(id: string): Promise<void> {
    await this.getCollection().deleteOne({ _id: ObjectId.createFromHexString(id) });
  }

  async getById(id: string) {
    const dbo = await this.getCollection().findOne({ _id: ObjectId.createFromHexString(id) });
    if (!dbo) {
      return Result.fail(DatavizMapper.notFoundError(id));
    }
    return Result.ok(DatavizMapper.toDomain(dbo));
  }

  async list(): Promise<Dataviz[]> {
    const dbos = await this.getCollection().find().sort({ name: 1 }).toArray();
    return dbos.map(DatavizMapper.toDomain);
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const query: Record<string, unknown> = { name };
    if (excludeId) {
      query._id = { $ne: ObjectId.createFromHexString(excludeId) };
    }
    const doc = await this.getCollection().findOne(query);
    return Boolean(doc);
  }

  async setProcessing(id: string, processing: Dataviz['processing']): Promise<void> {
    await this.getCollection().updateOne(
      { _id: ObjectId.createFromHexString(id) },
      { $set: { processing, updatedAt: Date.now() } }
    );
  }
}

export { MongoDatavizDataSource };
