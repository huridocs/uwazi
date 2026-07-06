/* eslint-disable camelcase */
import { ObjectId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { FileDBO } from '#api/core/infrastructure/mongodb/files/schemas/FilesTypes.js';
import { SyncHandler } from './SyncHandler.js';

export class MongoFilesSyncHandler
  extends MongoDataSource<FileDBO>
  implements SyncHandler<FileDBO>
{
  protected collectionName = 'files';

  constructor() {
    super(getConnection(), TransactionManagerFactory.default(), { useSyncedCollection: false });
  }

  async getById(id: string): Promise<FileDBO | null> {
    return this.getCollection().findOne({ _id: new ObjectId(id) });
  }

  async save(document: Partial<FileDBO>): Promise<FileDBO> {
    const { _id: rawId, tenant_id, ...rest } = document as FileDBO & { tenant_id?: string };
    if (!rawId) {
      throw new Error('MongoFilesSyncHandler: document._id is required');
    }
    const id = rawId instanceof ObjectId ? rawId : new ObjectId(rawId as unknown as string);
    await this.getCollection().replaceOne({ _id: id }, { _id: id, ...rest } as FileDBO, {
      upsert: true,
    });
    return this.getCollection().findOne({ _id: id }) as Promise<FileDBO>;
  }

  async saveMultiple(documents: Partial<FileDBO>[]): Promise<FileDBO[]> {
    if (documents.length === 0) {
      return [];
    }

    const ids = documents.map(doc => {
      const rawId = (doc as FileDBO)._id;
      if (!rawId) {
        throw new Error('MongoFilesSyncHandler: document._id is required');
      }
      return rawId instanceof ObjectId ? rawId : new ObjectId(rawId as unknown as string);
    });

    await this.getCollection().bulkWrite(
      documents.map((doc, i) => {
        const { _id: _ignored, tenant_id, ...rest } = doc as FileDBO & { tenant_id?: string };
        return {
          replaceOne: {
            filter: { _id: ids[i] },
            replacement: { _id: ids[i], ...rest } as FileDBO,
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
