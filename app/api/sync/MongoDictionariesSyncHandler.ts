import { ObjectId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { SyncHandler } from './SyncHandler.js';

interface ThesaurusDocument {
  _id: ObjectId;
  name: string;
  values: { id: string; label: string; values?: { id: string; label: string }[] }[];
}

export class MongoDictionariesSyncHandler
  extends MongoDataSource<ThesaurusDocument>
  implements SyncHandler<ThesaurusDocument>
{
  protected collectionName = 'dictionaries';

  constructor() {
    super(getConnection(), TransactionManagerFactory.default(), { useSyncedCollection: false });
  }

  async getById(id: string): Promise<ThesaurusDocument | null> {
    return this.getCollection().findOne({ _id: new ObjectId(id) });
  }

  async save(document: Partial<ThesaurusDocument>): Promise<ThesaurusDocument> {
    const { _id: rawId, ...rest } = document as ThesaurusDocument;
    if (!rawId) throw new Error('MongoDictionariesSyncHandler: document._id is required');
    const id = rawId instanceof ObjectId ? rawId : new ObjectId(rawId as unknown as string);
    await this.getCollection().replaceOne({ _id: id }, { _id: id, ...rest } as ThesaurusDocument, {
      upsert: true,
    });
    return this.getCollection().findOne({ _id: id }) as Promise<ThesaurusDocument>;
  }

  async saveMultiple(documents: Partial<ThesaurusDocument>[]): Promise<ThesaurusDocument[]> {
    if (documents.length === 0) return [];

    const ids = documents.map(doc => {
      const rawId = (doc as ThesaurusDocument)._id;
      if (!rawId) throw new Error('MongoDictionariesSyncHandler: document._id is required');
      return rawId instanceof ObjectId ? rawId : new ObjectId(rawId as unknown as string);
    });

    await this.getCollection().bulkWrite(
      documents.map((doc, i) => {
        const { _id: _ignored, ...rest } = doc as ThesaurusDocument;
        const id = ids[i];
        return {
          replaceOne: {
            filter: { _id: id },
            replacement: { _id: id, ...rest } as ThesaurusDocument,
            upsert: true,
          },
        };
      })
    );

    return this.getCollection()
      .find({ _id: { $in: ids } })
      .toArray();
  }

  async delete(id: string): Promise<void> {
    await this.getCollection().deleteOne({ _id: new ObjectId(id) });
  }
}
