import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { DuplicatedKeyError } from 'api/common.v2/errors/DuplicatedKeyError';
import { MongoBulkWriteError, OptionalId } from 'mongodb';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { TranslationsDataSource } from '../contracts/TranslationsDataSource';
import { TranslationMappers } from '../database/TranslationMappers';
import { Translation } from '../model/Translation';
import { TranslationDBO } from '../schemas/TranslationDBO';

export class MongoTranslationsDataSource
  extends MongoDataSource<OptionalId<TranslationDBO>>
  implements TranslationsDataSource
{
  protected collectionName = 'translationsV2';

  async insert(translations: Translation[]): Promise<Translation[]> {
    const items = translations.map(translation => TranslationMappers.toDBO(translation));
    try {
      await this.getCollection().insertMany(items);
    } catch (e) {
      if (e instanceof MongoBulkWriteError && e.message.match('E11000')) {
        throw new DuplicatedKeyError(e.message);
      }
      throw e;
    }
    return translations;
  }

  async upsert(translations: Translation[]): Promise<Translation[]> {
    const items = translations.map(translation => TranslationMappers.toDBO(translation));
    const stream = this.createBulkStream();

    await items.reduce(async (previous, item) => {
      await previous;
      await stream.updateOne(
        { language: item.language, key: item.key, 'context.id': item.context.id },
        { $set: item },
        true
      );
    }, Promise.resolve());

    await stream.flush();
    return translations;
  }

  async deleteByContextId(contextId: string) {
    return this.getCollection().deleteMany({ 'context.id': contextId });
  }

  async deleteByLanguage(language: LanguageISO6391) {
    return this.getCollection().deleteMany({ language });
  }

  getAll() {
    return new MongoResultSet<TranslationDBO, Translation>(
      this.getCollection().find({}),
      TranslationMappers.toModel
    );
  }

  getByLanguage(language: LanguageISO6391) {
    return new MongoResultSet<TranslationDBO, Translation>(
      this.getCollection().find({ language }),
      TranslationMappers.toModel
    );
  }

  getByContext(context: string) {
    return new MongoResultSet<TranslationDBO, Translation>(
      this.getCollection().find({ 'context.id': context }),
      TranslationMappers.toModel
    );
  }

  getContextAndKeys(contextId: string, keys: string[]) {
    return new MongoResultSet<TranslationDBO, Translation>(
      this.getCollection().find({ 'context.id': contextId, key: { $in: keys } }),
      TranslationMappers.toModel
    );
  }

  async updateContextLabel(contextId: string, contextLabel: string) {
    return this.getCollection().updateMany(
      { 'context.id': contextId },
      { $set: { 'context.label': contextLabel } }
    );
  }

  async updateKeysByContext(contextId: string, keyChanges: { [k: string]: string }) {
    const stream = this.createBulkStream();

    await Object.entries(keyChanges).reduce(async (previous, [keyName, newKeyName]) => {
      await previous;
      await stream.updateMany(
        { 'context.id': contextId, key: keyName },
        { $set: { key: newKeyName } }
      );
    }, Promise.resolve());
    await stream.flush();
  }

  async deleteKeysByContext(contextId: string, keysToDelete: string[]) {
    return this.getCollection().deleteMany({ 'context.id': contextId, key: { $in: keysToDelete } });
  }

  async calculateNonexistentKeys(contextId: string, keys: string[]) {
    const context = await this.getCollection().findOne({ 'context.id': contextId });
    if (!context) {
      return keys;
    }

    const [result] = await this.getCollection()
      .aggregate([
        { $match: { key: { $in: keys }, 'context.id': contextId } },
        { $group: { _id: null, foundKeys: { $push: '$key' } } },
        { $project: { notFoundKeys: { $setDifference: [keys, '$foundKeys'] } } },
      ])
      .toArray();

    return result?.notFoundKeys || keys;
  }
}
