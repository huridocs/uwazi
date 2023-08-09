import { SyncDBDataSource } from 'api/common.v2/contracts/SyncDBDataSource';
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { DeleteResult, ObjectId, OptionalId } from 'mongodb';
import { TranslationDBO } from '../schemas/TranslationDBO';

export class MongoTranslationsSyncDataSource
  extends MongoDataSource<OptionalId<TranslationDBO>>
  implements SyncDBDataSource<TranslationDBO>
{
  protected collectionName = 'translationsV2';

  async save(translation: TranslationDBO): Promise<TranslationDBO> {
    await this.getCollection().updateOne(
      { _id: translation._id },
      { $set: translation },
      { upsert: true }
    );
    return translation;
  }

  async saveMultiple(translations: TranslationDBO[]): Promise<TranslationDBO[]> {
    const stream = this.createBulkStream();
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

  async delete(query: { _id: string }): Promise<DeleteResult> {
    return this.getCollection().deleteOne({ _id: new ObjectId(query._id) });
  }
}
