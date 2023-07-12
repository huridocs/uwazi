import { DeleteResult, ObjectId } from 'mongodb';
import { TranslationsSyncDataSource } from '../contracts/TranslationsSyncDataSource';
import { TranslationDBO } from '../schemas/TranslationDBO';
import { MongoTranslationsDataSource } from './MongoTranslationsDataSource';

export class MongoTranslationsSyncDataSource
  extends MongoTranslationsDataSource
  implements TranslationsSyncDataSource
{
  async save(translation: TranslationDBO): Promise<TranslationDBO> {
    await this.getCollection().updateOne(
      {
        language: translation.language,
        key: translation.key,
        'context.id': translation.context.id,
      },
      { $set: translation },
      { upsert: true }
    );
    return translation;
  }

  async saveMultiple(translations: TranslationDBO[]): Promise<TranslationDBO[]> {
    const stream = this.createBulkStream();
    await translations.reduce(async (previous, translation) => {
      await previous;
      await stream.updateOne(
        {
          language: translation.language,
          key: translation.key,
          'context.id': translation.context.id,
        },
        { $set: translation },
        true
      );
    }, Promise.resolve());

    await stream.flush();
    return translations;
  }

  async getById(translationId: string): Promise<TranslationDBO | null> {
    return this.getCollection().findOne({ _id: new ObjectId(translationId) });
  }

  async delete(query: { _id: string }): Promise<DeleteResult> {
    return this.getCollection().deleteOne({ _id: new ObjectId(query._id) });
  }
}
