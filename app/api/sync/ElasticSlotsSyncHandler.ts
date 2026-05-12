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
    const id = _id instanceof ObjectId ? _id : new ObjectId(_id as unknown as string);
    await this.getCollection().replaceOne({ _id: id }, { _id: id, ...rest } as SlotDocument, {
      upsert: true,
    });
    return this.getCollection().findOne({ _id: id }) as Promise<SlotDocument>;
  }

  async saveMultiple(documents: Partial<SlotDocument>[]): Promise<SlotDocument[]> {
    if (documents.length === 0) return [];

    await this.getCollection().bulkWrite(
      documents.map(doc => {
        const { _id, ...rest } = doc as SlotDocument;
        const id = _id instanceof ObjectId ? _id : new ObjectId(_id as unknown as string);
        return {
          replaceOne: {
            filter: { _id: id },
            replacement: { _id: id, ...rest } as SlotDocument,
            upsert: true,
          },
        };
      })
    );

    const ids = documents.map(doc => {
      const id = (doc as SlotDocument)._id;
      return id instanceof ObjectId ? id : new ObjectId(id as unknown as string);
    });

    return this.getCollection()
      .find({ _id: { $in: ids } })
      .toArray();
  }
}
