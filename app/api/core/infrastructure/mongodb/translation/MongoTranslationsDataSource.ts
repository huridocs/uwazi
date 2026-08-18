import { MongoBulkWriteError, OptionalId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoResultSet } from '#api/core/infrastructure/mongodb/common/MongoResultSet.js';
import { DuplicatedKeyError } from '#api/common.v2/errors/DuplicatedKeyError.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import {
  BulkDeleteKeysByContext,
  TranslationsDataSource,
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
    if (!translations.length) {
      return translations;
    }

    const items = translations.map(translation => TranslationMappers.toDBO(translation));
    await this.getCollection().bulkWrite(
      items.map(item => ({
        updateOne: {
          filter: { language: item.language, key: item.key, 'context.id': item.context.id },
          update: { $set: item },
          upsert: true,
        },
      }))
    );
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

  getByLanguageExcludingContextTypes(
    language: LanguageISO6391,
    types: TranslationContext['type'][]
  ) {
    return new MongoResultSet<TranslationDBO, Translation>(
      this.getCollection().find({ language, 'context.type': { $nin: types } }),
      TranslationMappers.toModel
    );
  }

  getByContext(context: string) {
    return new MongoResultSet<TranslationDBO, Translation>(
      this.getCollection().find({ 'context.id': context }),
      TranslationMappers.toModel
    );
  }

  getByLanguageAndContext(language: LanguageISO6391, contextId: string) {
    return new MongoResultSet<TranslationDBO, Translation>(
      this.getCollection().find({ language, 'context.id': contextId }),
      TranslationMappers.toModel
    );
  }

  getContextAndKeys(contextId: string, keys: string[]) {
    return new MongoResultSet<TranslationDBO, Translation>(
      this.getCollection().find({ 'context.id': contextId, key: { $in: keys } }),
      TranslationMappers.toModel
    );
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
    if (!keys.length) {
      return [];
    }

    const found = await this.getCollection()
      .find({ 'context.id': contextId, key: { $in: keys } }, { projection: { key: 1 } })
      .toArray();
    const foundKeys = new Set(found.map(doc => doc.key));
    return keys.filter(key => !foundKeys.has(key));
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
