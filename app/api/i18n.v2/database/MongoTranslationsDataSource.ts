import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
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
    await this.getCollection().insertMany(items, {
      session: this.getSession(),
    });

    return translations;
  }

  async insertAndIgnoreUniqueError(translations: Translation[]): Promise<Translation[]> {
    const items = translations.map(translation => TranslationMappers.toDBO(translation));

    try {
      await this.getCollection().insertMany(items, {
        session: this.getSession(),
        ordered: false,
      });
    } catch (e) {
      if (!e.message.match(/E11000/)) {
        throw e;
      }
    }

    return translations;
  }

  async upsert(translations: Translation[]): Promise<Translation[]> {
    const items = translations.map(translation => TranslationMappers.toDBO(translation));
    const writeStream = this.createBulkStream();

    await Promise.all(
      items.map(async item =>
        writeStream.updateOne(
          { language: item.language, key: item.key, 'context.id': item.context.id },
          { $set: item },
          true
        )
      )
    );
    await writeStream.flush();

    return translations;
  }

  async deleteByContextId(contextId: string) {
    return this.getCollection().deleteMany({ 'context.id': contextId });
  }

  async deleteByLanguage(language: string) {
    return this.getCollection().deleteMany({ language });
  }

  getAll() {
    return new MongoResultSet<TranslationDBO, Translation>(
      this.getCollection().find(),
      TranslationMappers.toModel
    );
  }

  getByLanguage(language: string) {
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

  async updateContextLabel(contextId: string, contextLabel: string) {
    return this.getCollection().updateMany(
      { 'context.id': contextId },
      { $set: { 'context.label': contextLabel } }
    );
  }

  async updateContextKeys(contextId: string, keyChanges: { [k: string]: string }) {
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

  async updateValue(key: string, contextId: string, language: string, value: string) {
    await this.getCollection().updateOne(
      { key, 'context.id': contextId, language },
      { $set: { value } }
    );
  }

  async deleteKeysByContext(contextId: string, keysToDelete: string[]) {
    return this.getCollection().deleteMany({ 'context.id': contextId, key: { $in: keysToDelete } });
  }
}
