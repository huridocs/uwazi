import { ObjectId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { SyncHandler } from './SyncHandler.js';

type RelationshipTypeSyncDocument = {
  _id: ObjectId;
  name?: string;
  properties?: unknown[];
};

const toObjectId = (id: RelationshipTypeSyncDocument['_id'] | string) =>
  id instanceof ObjectId ? id : new ObjectId(id);

const toReplacementDocument = (
  document: Partial<RelationshipTypeSyncDocument>,
  id: ObjectId
): RelationshipTypeSyncDocument => {
  const { _id: _ignored, ...rest } = document;
  return { _id: id, ...rest };
};

export class MongoRelationshipTypesSyncHandler
  extends MongoDataSource<RelationshipTypeSyncDocument>
  implements SyncHandler<RelationshipTypeSyncDocument>
{
  protected collectionName = 'relationtypes';

  constructor() {
    super(getConnection(), TransactionManagerFactory.default(), { useSyncedCollection: false });
  }

  async getById(id: string): Promise<RelationshipTypeSyncDocument | null> {
    return this.getCollection().findOne({ _id: new ObjectId(id) });
  }

  async save(
    document: Partial<RelationshipTypeSyncDocument>
  ): Promise<RelationshipTypeSyncDocument> {
    const rawId = document._id;
    if (!rawId) {
      throw new Error('MongoRelationshipTypesSyncHandler: document._id is required');
    }
    const id = toObjectId(rawId);
    const replacement = toReplacementDocument(document, id);
    await this.getCollection().replaceOne({ _id: id }, replacement, { upsert: true });
    return this.getCollection().findOne({ _id: id }) as Promise<RelationshipTypeSyncDocument>;
  }

  async saveMultiple(
    documents: Partial<RelationshipTypeSyncDocument>[]
  ): Promise<RelationshipTypeSyncDocument[]> {
    if (documents.length === 0) {
      return [];
    }

    const ids = documents.map(doc => {
      const rawId = doc._id;
      if (!rawId) {
        throw new Error('MongoRelationshipTypesSyncHandler: document._id is required');
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
