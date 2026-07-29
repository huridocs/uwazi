import { ObjectId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { SyncHandler } from './SyncHandler.js';

type RelationtypeSyncDocument = {
  _id: ObjectId;
  name?: string;
  properties?: unknown[];
};

const toObjectId = (id: RelationtypeSyncDocument['_id'] | string) =>
  id instanceof ObjectId ? id : new ObjectId(id);

const toReplacementDocument = (
  document: Partial<RelationtypeSyncDocument>,
  id: ObjectId
): RelationtypeSyncDocument => {
  const { _id: _ignored, ...rest } = document;
  return { _id: id, ...rest };
};

export class MongoRelationtypesSyncHandler
  extends MongoDataSource<RelationtypeSyncDocument>
  implements SyncHandler<RelationtypeSyncDocument>
{
  protected collectionName = 'relationtypes';

  constructor() {
    super(getConnection(), TransactionManagerFactory.default(), { useSyncedCollection: false });
  }

  async getById(id: string): Promise<RelationtypeSyncDocument | null> {
    return this.getCollection().findOne({ _id: new ObjectId(id) });
  }

  async save(document: Partial<RelationtypeSyncDocument>): Promise<RelationtypeSyncDocument> {
    const rawId = document._id;
    if (!rawId) {
      throw new Error('MongoRelationtypesSyncHandler: document._id is required');
    }
    const id = toObjectId(rawId);
    const replacement = toReplacementDocument(document, id);
    await this.getCollection().replaceOne({ _id: id }, replacement, { upsert: true });
    return this.getCollection().findOne({ _id: id }) as Promise<RelationtypeSyncDocument>;
  }

  async saveMultiple(
    documents: Partial<RelationtypeSyncDocument>[]
  ): Promise<RelationtypeSyncDocument[]> {
    if (documents.length === 0) {
      return [];
    }

    const ids = documents.map(doc => {
      const rawId = doc._id;
      if (!rawId) {
        throw new Error('MongoRelationtypesSyncHandler: document._id is required');
      }
      return toObjectId(rawId);
    });

    await this.getCollection().bulkWrite(
      documents.map((doc, i) => ({
        replaceOne: {
          filter: { _id: ids[i] },
          replacement: toReplacementDocument(doc, ids[i]),
          upsert: true,
        },
      }))
    );

    return this.getCollection()
      .find({ _id: { $in: ids } })
      .toArray();
  }

  async delete(id: string): Promise<void> {
    await this.getCollection().deleteOne({ _id: new ObjectId(id) });
  }
}
