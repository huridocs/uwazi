import { ObjectId } from 'mongodb';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoTranslationsSyncDataSource } from '#api/core/infrastructure/mongodb/translation/MongoTranslationsSyncDataSource.js';
import { TranslationSyO } from '#api/core/infrastructure/mongodb/translation/schemas/TranslationSyO.js';
import { SyncHandler } from './SyncHandler.js';

/**
 * Sync handler for translationsV2.
 * Preserves historical POST /api/sync semantics: delete by natural key
 * (language + key + context.id) before upserting the synced document.
 */
export class MongoTranslationsSyncHandler implements SyncHandler<TranslationSyO> {
  private readonly dataSource: MongoTranslationsSyncDataSource;

  constructor() {
    this.dataSource = new MongoTranslationsSyncDataSource(
      getConnection(),
      TransactionManagerFactory.default()
    );
  }

  async getById(id: string): Promise<TranslationSyO | null> {
    const row = await this.dataSource.getById(id);
    if (!row) {
      return null;
    }
    return { ...row, _id: row._id.toString() };
  }

  async save(document: Partial<TranslationSyO>): Promise<TranslationSyO> {
    const translation = document as TranslationSyO;
    if (!translation.language || !translation.key || !translation.context?.id) {
      throw new Error(
        'MongoTranslationsSyncHandler: language, key, and context.id are required to save'
      );
    }

    await this.dataSource.delete(
      { _id: '' },
      {
        language: translation.language,
        key: translation.key,
        'context.id': translation.context.id,
      }
    );

    const saved = await this.dataSource.save(translation);
    return { ...saved, _id: saved._id.toString() };
  }

  async saveMultiple(documents: Partial<TranslationSyO>[]): Promise<TranslationSyO[]> {
    return documents.reduce<Promise<TranslationSyO[]>>(async (previous, document) => {
      const saved = await previous;
      saved.push(await this.save(document));
      return saved;
    }, Promise.resolve([]));
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.delete({ _id: id }, { _id: new ObjectId(id) });
  }
}
