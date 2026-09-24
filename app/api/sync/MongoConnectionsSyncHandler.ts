import { ObjectId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { ConnectionsSyncHandler, ConnectionSyncDocument } from './ConnectionsSyncHandler.js';

const toObjectId = (value: unknown): ObjectId | null => {
  if (value === undefined || value === null) return null;
  if (value instanceof ObjectId) return value;
  return new ObjectId(String(value));
};

const toReplacementDocument = (
  document: Partial<ConnectionSyncDocument>,
  id: ObjectId
): Record<string, unknown> => {
  const replacement: Record<string, unknown> = { _id: id };
  if (document.entity !== undefined) replacement.entity = document.entity;
  if (document.hub !== undefined) replacement.hub = toObjectId(document.hub);
  if (document.template !== undefined) replacement.template = toObjectId(document.template);
  if (document.file !== undefined) replacement.file = document.file;
  if (document.metadata !== undefined) replacement.metadata = document.metadata;
  if (document.reference !== undefined) replacement.reference = document.reference;
  if (document.sharedId !== undefined) replacement.sharedId = toObjectId(document.sharedId);
  if (document.filename !== undefined) replacement.filename = document.filename;
  if (document.range !== undefined) replacement.range = document.range;
  return replacement;
};

export class MongoConnectionsSyncHandler
  extends MongoDataSource<ConnectionSyncDocument>
  implements ConnectionsSyncHandler
{
  protected collectionName = 'connections';

  constructor() {
    super(getConnection(), TransactionManagerFactory.mongo(), { useSyncedCollection: false });
  }

  async getById(id: string): Promise<ConnectionSyncDocument | null> {
    return this.getCollection().findOne({ _id: new ObjectId(id) });
  }

  async getHubConnections(hubId: string): Promise<ConnectionSyncDocument[]> {
    return this.getCollection()
      .find({ hub: new ObjectId(hubId) })
      .toArray();
  }

  async save(document: Partial<ConnectionSyncDocument>): Promise<ConnectionSyncDocument> {
    const rawId = document._id;
    if (!rawId) {
      throw new Error('MongoConnectionsSyncHandler: document._id is required');
    }
    const id = rawId instanceof ObjectId ? rawId : new ObjectId(String(rawId));
    await this.getCollection().replaceOne({ _id: id }, toReplacementDocument(document, id), {
      upsert: true,
    });
    return (await this.getCollection().findOne({ _id: id })) as ConnectionSyncDocument;
  }

  async saveMultiple(
    documents: Partial<ConnectionSyncDocument>[]
  ): Promise<ConnectionSyncDocument[]> {
    if (documents.length === 0) {
      return [];
    }

    const ids = documents.map(document => {
      const rawId = document._id;
      if (!rawId) {
        throw new Error('MongoConnectionsSyncHandler: document._id is required');
      }
      return rawId instanceof ObjectId ? rawId : new ObjectId(String(rawId));
    });

    await this.getCollection().bulkWrite(
      documents.map((document, index) => ({
        replaceOne: {
          filter: { _id: ids[index] },
          replacement: toReplacementDocument(document, ids[index]),
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
