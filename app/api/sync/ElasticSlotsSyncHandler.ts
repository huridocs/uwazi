import { ObjectId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoSlotsDAO } from '#api/core/infrastructure/elasticSearch/entities/MongoSlotsDAO.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import type { SlotDocument } from '#api/core/infrastructure/elasticSearch/entities/MongoSlotsDAO.js';
import { SyncHandler } from './SyncHandler.js';

export class ElasticSlotsSyncHandler
  extends MongoDataSource<SlotDocument>
  implements SyncHandler<SlotDocument>
{
  protected collectionName = MongoSlotsDAO.collectionName;

  constructor() {
    super(getConnection(), TransactionManagerFactory.default(), { useSyncedCollection: false });
  }

  async getById(id: string): Promise<SlotDocument | null> {
    return this.getCollection().findOne({ _id: new ObjectId(id) });
  }

  async save(document: Partial<SlotDocument>): Promise<SlotDocument> {
    const { _id, ...rest } = document as SlotDocument;
    if (!_id) throw new Error('ElasticSlotsSyncHandler: document._id is required');
    await this.getCollection().replaceOne({ _id }, { _id, ...rest } as SlotDocument, {
      upsert: true,
    });
    MongoSlotsDAO.clearCache();
    return this.getCollection().findOne({ _id }) as Promise<SlotDocument>;
  }

  async saveMultiple(documents: Partial<SlotDocument>[]): Promise<SlotDocument[]> {
    if (documents.length === 0) return [];

    await this.getCollection().bulkWrite(
      documents.map(doc => {
        const { _id, ...rest } = doc as SlotDocument;
        if (!_id) throw new Error('ElasticSlotsSyncHandler: document._id is required');
        return {
          replaceOne: {
            filter: { _id },
            replacement: { _id, ...rest } as SlotDocument,
            upsert: true,
          },
        };
      })
    );
    MongoSlotsDAO.clearCache();

    const ids = documents.map(doc => {
      const id = (doc as SlotDocument)._id;
      if (!id) throw new Error('ElasticSlotsSyncHandler: document._id is required');
      return id;
    });

    return this.getCollection()
      .find({ _id: { $in: ids } })
      .toArray();
  }

  // eslint-disable-next-line
  async delete(_id: string): Promise<void> {
    // Slots are never deleted via sync; this is intentionally a no-op.
  }
}
