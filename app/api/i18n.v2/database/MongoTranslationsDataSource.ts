import { MongoDataSource } from 'api/core/infrastructure/mongodb/common/MongoDataSource';
import { MongoResultSet } from 'api/core/infrastructure/mongodb/common/MongoResultSet';
import { DuplicatedKeyError } from 'api/common.v2/errors/DuplicatedKeyError';
import { AnyBulkWriteOperation, MongoBulkWriteError, OptionalId } from 'mongodb';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import {
  BulkDeleteKeysByContext,
  TranslationsDataSource,
  UpdateKeysByContextProps,
} from '../contracts/TranslationsDataSource';
import { TranslationMappers } from '../database/TranslationMappers';
import { Translation, TranslationContext } from '../model/Translation';
import { TranslationDBO } from '../schemas/TranslationDBO';
import { TranslationContextModel } from '../model/TranslationContextModel';

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

  async deleteKeysByContext(contextId: string, keysToDelete: string[]) {
    return this.getCollection().deleteMany({ 'context.id': contextId, key: { $in: keysToDelete } });
  }

  async bulkDeleteKeysByContext(props: BulkDeleteKeysByContext) {
    await this.getCollection().bulkWrite(
      props.map(({ contextId, keysToDelete }) => ({
        deleteMany: { filter: { 'context.id': contextId, key: { $in: keysToDelete } } },
      }))
    );
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

  /**
   * Fetches a TranslationContext domain model from the database.
   * Returns an empty context if no translations exist yet (e.g., new template/thesaurus).
   */
  async getContext(
    contextInfo: TranslationContext,
    languages: LanguageISO6391[],
    defaultLanguage: LanguageISO6391
  ): Promise<TranslationContextModel> {
    const translations = await this.getByContext(contextInfo.id).all();

    return TranslationContextModel.create(contextInfo, translations, languages, defaultLanguage);
  }

  /**
   * Persists changes from a TranslationContext domain model to the database.
   * Uses the diff to optimize database operations.
   */
  async updateContext(context: TranslationContextModel): Promise<void> {
    const diff = context.getDiff();

    if (!diff.hasChanges()) {
      return;
    }

    const bulkOps: AnyBulkWriteOperation<OptionalId<TranslationDBO>>[] = [];

    if (diff.contextLabelChanged) {
      const contextInfo = context.getContextInfo();
      bulkOps.push({
        updateMany: {
          filter: { 'context.id': contextInfo.id },
          update: { $set: { 'context.label': contextInfo.label } },
        },
      });
    }

    if (diff.addedTranslations.length > 0) {
      diff.addedTranslations.forEach(translation => {
        bulkOps.push({
          insertOne: {
            document: TranslationMappers.toDBO(translation),
          },
        });
      });
    }

    if (diff.updatedTranslations.length > 0) {
      diff.updatedTranslations.forEach(translation => {
        bulkOps.push({
          updateOne: {
            filter: {
              'context.id': translation.context.id,
              key: translation.key,
              language: translation.language,
            },
            update: { $set: TranslationMappers.toDBO(translation) },
          },
        });
      });
    }

    if (diff.deletedKeys.length > 0) {
      const contextInfo = context.getContextInfo();
      bulkOps.push({
        deleteMany: {
          filter: {
            'context.id': contextInfo.id,
            key: { $in: diff.deletedKeys },
          },
        },
      });
    }

    if (bulkOps.length > 0) {
      await this.getCollection().bulkWrite(bulkOps);
    }
  }
}
