import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { DuplicatedKeyError } from 'api/common.v2/errors/DuplicatedKeyError';
import { MongoBulkWriteError } from 'mongodb';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { TranslationsDataSource } from '../contracts/TranslationsDataSource';
import { TranslationMappers } from '../database/TranslationMappers';
import { Translation } from '../model/Translation';
import { TranslationDBO } from '../schemas/TranslationDBO';

export class MongoTranslationsDataSource
  extends MongoDataSource<TranslationDBO>
  implements TranslationsDataSource
{
  protected collectionName = 'translations_v2';

  async insert(translations: Translation[]): Promise<Translation[]> {
    const items = translations.map(translation => TranslationMappers.toDBO(translation));
    try {
      await this.getCollection().insertMany(items, { session: this.getSession() });
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
    return this.getCollection().deleteMany(
      { 'context.id': contextId },
      { session: this.getSession() }
    );
  }

  async deleteByLanguage(language: LanguageISO6391) {
    return this.getCollection().deleteMany({ language }, { session: this.getSession() });
  }

  getAll() {
    return new MongoResultSet<TranslationDBO, Translation>(
      this.getCollection().find({}, { session: this.getSession() }),
      TranslationMappers.toModel
    );
  }

  getByLanguage(language: LanguageISO6391) {
    return new MongoResultSet<TranslationDBO, Translation>(
      this.getCollection().find({ language }, { session: this.getSession() }),
      TranslationMappers.toModel
    );
  }

  getByContext(context: string) {
    return new MongoResultSet<TranslationDBO, Translation>(
      this.getCollection().find({ 'context.id': context }, { session: this.getSession() }),
      TranslationMappers.toModel
    );
  }

  getContextAndKeys(contextId: string, keys: string[]) {
    return new MongoResultSet<TranslationDBO, Translation>(
      this.getCollection().find(
        { 'context.id': contextId, key: { $in: keys } },
        { session: this.getSession() }
      ),
      TranslationMappers.toModel
    );
  }

  async updateContextLabel(contextId: string, contextLabel: string) {
    return this.getCollection().updateMany(
      { 'context.id': contextId },
      { $set: { 'context.label': contextLabel } },
      { session: this.getSession() }
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

  async updateValue(key: string, contextId: string, language: LanguageISO6391, value: string) {
    await this.getCollection().updateOne(
      { key, 'context.id': contextId, language },
      { $set: { value } },
      { session: this.getSession() }
    );
  }

  async deleteKeysByContext(contextId: string, keysToDelete: string[]) {
    return this.getCollection().deleteMany(
      { 'context.id': contextId, key: { $in: keysToDelete } },
      { session: this.getSession() }
    );
  }

  async calculateNonexistentKeys(contextId: string, keys: string[]) {
    const context = await this.getCollection().findOne(
      { 'context.id': contextId },
      { session: this.getSession() }
    );
    if (!context) {
      return keys;
    }

    const [result] = await this.getCollection()
      .aggregate(
        [
          { $match: { key: { $in: keys }, 'context.id': contextId } },
          { $group: { _id: null, foundKeys: { $push: '$key' } } },
          { $project: { notFoundKeys: { $setDifference: [keys, '$foundKeys'] } } },
        ],
        { session: this.getSession() }
      )
      .toArray();

    return result?.notFoundKeys || [];
  }
}
