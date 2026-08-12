import { MongoBulkWriteError, OptionalId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoResultSet } from '#api/core/infrastructure/mongodb/common/MongoResultSet.js';
import { DuplicatedKeyError } from '#api/common.v2/errors/DuplicatedKeyError.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import {
  BulkDeleteKeysByContext,
  TranslationsDataSource,
  UpdateKeysByContextProps,
} from '#api/core/application/contracts/TranslationsDataSource.js';
import { TranslationMappers } from '#api/core/infrastructure/mongodb/translation/mappings/TranslationMappers.js';
import { Translation, TranslationContext } from '#api/core/domain/translation/Translation.js';
import { TranslationDBO } from '#api/core/infrastructure/mongodb/translation/schemas/TranslationDBO.js';
import { TranslationContextModel } from '#api/core/domain/translation/TranslationContextModel.js';
import { buildTranslationContextBulkOps } from './buildTranslationContextBulkOps.js';

export class MongoTranslationsDataSource
  extends MongoDataSource<OptionalId<TranslationDBO>>
  implements TranslationsDataSource
{
  protected collectionName = 'translationsV2';

  async insert(translations: Translation[]): Promise<Translation[]> {
    const items = translations.map(translation => TranslationMappers.toDBO(translation));
    try {
      if (items.length > 0) await this.getCollection().insertMany(items);
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

  async deleteByContextId(contextId: string): Promise<void> {
    await this.getCollection().deleteMany({ 'context.id': contextId });
  }

  async deleteByLanguage(language: LanguageISO6391): Promise<void> {
    await this.getCollection().deleteMany({ language });
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

  async updateContextLabel(contextId: string, contextLabel: string): Promise<void> {
    await this.getCollection().updateMany(
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

  async updateKeysByContextV2(props: UpdateKeysByContextProps): Promise<void> {
    await this.getCollection().bulkWrite(
      Object.entries(props.keyChanges).map(([from, to]) => ({
        updateMany: {
          filter: {
            'context.id': props.contextId,
            key: from,
          },
          update: [
            {
              $set: {
                key: to,
                value: {
                  $cond: [{ $eq: ['$language', props.defaultLanguage] }, to, '$value'],
                },
              },
            },
          ],
          upsert: false,
        },
      }))
    );
  }

  async deleteKeysByContext(contextId: string, keysToDelete: string[]): Promise<void> {
    await this.getCollection().deleteMany({
      'context.id': contextId,
      key: { $in: keysToDelete },
    });
  }

  async bulkDeleteKeysByContext(props: BulkDeleteKeysByContext) {
    await this.getCollection().bulkWrite(
      props.map(({ contextId, keysToDelete }) => ({
        deleteMany: { filter: { 'context.id': contextId, key: { $in: keysToDelete } } },
      }))
    );
  }

  async cloneForLanguage(from: LanguageISO6391, to: LanguageISO6391): Promise<void> {
    const cursor = this.getCollection().find({ language: from });
    const stream = this.createBulkStream();

    for await (const { _id, ...doc } of cursor) {
      await stream.updateOne(
        { language: to, key: doc.key, 'context.id': doc.context.id },
        { $setOnInsert: { ...doc, language: to } },
        true
      );
    }
    await stream.flush();
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

  async getContext(
    contextInfo: TranslationContext,
    languages: LanguageISO6391[],
    defaultLanguage: LanguageISO6391
  ): Promise<TranslationContextModel> {
    const translations = await this.getByContext(contextInfo.id).all();

    return TranslationContextModel.create(contextInfo, translations, languages, defaultLanguage);
  }

  async updateContext(context: TranslationContextModel): Promise<void> {
    const bulkOps = buildTranslationContextBulkOps(context);
    if (bulkOps.length > 0) {
      await this.getCollection().bulkWrite(bulkOps);
    }
  }
}
