import { DeleteResult, Filter, ObjectId, OptionalId } from 'mongodb';

import { SyncDBDataSource } from '#api/common.v2/database/SyncDBDataSource.js';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { TranslationMappers } from '#api/i18n.v2/database/TranslationMappers.js';
import { TranslationDBO } from '#api/i18n.v2/schemas/TranslationDBO.js';
import { TranslationSyO } from '#api/i18n.v2/schemas/TranslationSyO.js';

export class MongoTranslationsSyncDataSource
  extends MongoDataSource<OptionalId<TranslationDBO>>
  implements SyncDBDataSource<TranslationSyO, TranslationDBO>
{
  protected collectionName = 'translationsV2';

  async save(_translation: TranslationSyO): Promise<TranslationDBO> {
    const translation = TranslationMappers.fromSyncToDBO(_translation);
    await this.getCollection().updateOne(
      { _id: translation._id },
      { $set: translation },
      { upsert: true }
    );
    return translation;
  }

  async saveMultiple(_translations: TranslationSyO[]): Promise<TranslationDBO[]> {
    const stream = this.createBulkStream();
    const translations = _translations.map(TranslationMappers.fromSyncToDBO);
    await translations.reduce(async (previous, translation) => {
      await previous;
      await stream.updateOne({ _id: translation._id }, { $set: translation }, true);
    }, Promise.resolve());

    await stream.flush();
    return translations;
  }

  // eslint-disable-next-line class-methods-use-this
  async get(_query: any, _select?: any, _options?: any): Promise<TranslationDBO[]> {
    throw new Error('MongoTranslationsSyncDataSource.get is not implemented');
  }

  async getById(translationId: string): Promise<TranslationDBO | null> {
    return this.getCollection().findOne({ _id: new ObjectId(translationId) });
  }

  async delete(query: { _id: string }, filter?: Filter<TranslationDBO>): Promise<DeleteResult> {
    const param = filter || { _id: new ObjectId(query._id) };

    return this.getCollection().deleteOne(param);
  }
}
