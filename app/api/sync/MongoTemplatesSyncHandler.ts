import { ObjectId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { MongoTemplatesDAO } from '#api/core/infrastructure/mongodb/template/MongoTemplatesDAO.js';
import { TemplateDBO } from '#api/core/infrastructure/mongodb/template/DBOs/TemplateDBO.js';
import { SyncHandler } from './SyncHandler.js';

export class MongoTemplatesSyncHandler
  extends MongoDataSource<TemplateDBO>
  implements SyncHandler<TemplateDBO>
{
  protected collectionName = 'templates';

  private dao: MongoTemplatesDAO;

  constructor() {
    super(getConnection(), TransactionManagerFactory.default(), { useSyncedCollection: false });
    this.dao = new MongoTemplatesDAO({
      db: getConnection(),
      transactionManager: TransactionManagerFactory.default(),
    });
  }

  async getById(id: string): Promise<TemplateDBO | null> {
    const results = await this.dao.get([id]);
    return results[0] || null;
  }

  async save(document: Partial<TemplateDBO>): Promise<TemplateDBO> {
    await this.unsetOtherDefault(document);

    const { _id: rawId, ...rest } = document as TemplateDBO;
    if (!rawId) {
      throw new Error('MongoTemplatesSyncHandler: document._id is required');
    }
    const id = rawId instanceof ObjectId ? rawId : new ObjectId(rawId as unknown as string);
    await this.getCollection().replaceOne({ _id: id }, { _id: id, ...rest } as TemplateDBO, {
      upsert: true,
    });
    return this.getCollection().findOne({ _id: id }) as Promise<TemplateDBO>;
  }

  async saveMultiple(documents: Partial<TemplateDBO>[]): Promise<TemplateDBO[]> {
    if (documents.length === 0) {
      return [];
    }

    const syncedDefault = documents.find(template => template.default);
    if (syncedDefault) {
      await this.unsetOtherDefault(syncedDefault);
    }

    const ids = documents.map(doc => {
      const rawId = (doc as TemplateDBO)._id;
      if (!rawId) {
        throw new Error('MongoTemplatesSyncHandler: document._id is required');
      }
      return rawId instanceof ObjectId ? rawId : new ObjectId(rawId as unknown as string);
    });

    await this.getCollection().bulkWrite(
      documents.map((doc, i) => {
        const { _id: _ignored, ...rest } = doc as TemplateDBO;
        return {
          replaceOne: {
            filter: { _id: ids[i] },
            replacement: { _id: ids[i], ...rest } as TemplateDBO,
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

  private async unsetOtherDefault(document: Partial<TemplateDBO>): Promise<void> {
    if (!document.default) {
      return;
    }

    const currentDefault = await this.dao.getDefaultTemplate();
    if (currentDefault && currentDefault._id.toString() !== document._id?.toString()) {
      await this.getCollection().updateOne(
        { _id: currentDefault._id },
        { $set: { default: false } }
      );
    }
  }
}
