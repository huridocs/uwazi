import { Db, ObjectId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import { LanguageUtils } from '#shared/language/index.js';
import { LanguageISO6391, LanguageSchema, LanguagesListSchema } from '#shared/types/commonTypes.js';
import { Settings as SettingsType } from '#shared/types/settingsType.js';
import { SettingsDataSource } from '../../application/contracts/SettingsDataSource.js';
import { DefaultLanguageMissingError } from './errors/settingsErrors.js';
import { MongoTransactionManager } from './common/MongoTransactionManager.js';

type MongoSettingsDataSourceDeps = {
  db: Db;
  transactionManager: MongoTransactionManager;
};

export class MongoSettingsDataSource
  extends MongoDataSource<SettingsType>
  implements SettingsDataSource
{
  protected collectionName = 'settings';

  constructor(deps: MongoSettingsDataSourceDeps) {
    super(deps.db, deps.transactionManager);
  }

  async addLanguage(language: LanguageSchema): Promise<void> {
    await this.getCollection().updateOne(
      { languages: { $not: { $elemMatch: { key: language.key } } } },
      { $push: { languages: language } }
    );
  }

  async setLanguageInstalling(key: LanguageISO6391, installing: boolean): Promise<void> {
    await this.getCollection().updateOne(
      { 'languages.key': key },
      { $set: { 'languages.$.installing': installing } }
    );
  }

  async deleteLanguage(key: LanguageISO6391): Promise<void> {
    await this.getCollection().updateOne({}, { $pull: { languages: { key } } });
  }

  async getInstalledLanguages(): Promise<LanguagesListSchema> {
    const languages = await this.readLanguages();
    if (!languages) {
      return [];
    }

    return languages.map(
      language =>
        ({
          ...LanguageUtils.fromISO639_1(language.key),
          default: language.default,
        }) as LanguageSchema
    );
  }

  protected async readSettings(): Promise<SettingsType | null> {
    return this.getCollection().findOne({});
  }

  async readFields<K extends keyof SettingsType>(
    fields: readonly K[]
  ): Promise<(Pick<SettingsType, K> & { _id?: SettingsType['_id'] }) | null> {
    const projection = Object.fromEntries(fields.map(field => [field, 1])) as Record<string, 1>;
    return this.getCollection().findOne({}, { projection });
  }

  async readFeature<K extends keyof NonNullable<SettingsType['features']>>(
    name: K
  ): Promise<NonNullable<SettingsType['features']>[K] | undefined> {
    const settings = await this.getCollection().findOne(
      {},
      { projection: { [`features.${String(name)}`]: 1 } }
    );
    return settings?.features?.[name];
  }

  async readSyncConfig(): Promise<SettingsType['sync']> {
    const settings = await this.getCollection().findOne({}, { projection: { sync: 1 } });
    return settings?.sync;
  }

  async find(): Promise<SettingsType | null> {
    return this.readSettings();
  }

  async patch(partial: SettingsType): Promise<SettingsType> {
    const current = await this.find();
    const { _id: incomingId, __v: _version, ...fields } = partial;

    if (current?._id) {
      return this.mergeOntoExisting(current._id, fields);
    }

    return this.insertSingleton(incomingId, fields);
  }

  private async mergeOntoExisting(
    id: NonNullable<SettingsType['_id']>,
    fields: Omit<SettingsType, '_id' | '__v'>
  ): Promise<SettingsType> {
    if (Object.keys(fields).length) {
      await this.getCollection().updateOne({ _id: id }, { $set: fields });
    }
    return this.get();
  }

  private async insertSingleton(
    incomingId: SettingsType['_id'],
    fields: Omit<SettingsType, '_id' | '__v'>
  ): Promise<SettingsType> {
    const id =
      incomingId instanceof ObjectId
        ? incomingId
        : MongoIdHandler.mapToDb(String(incomingId ?? ''));
    if (!id || !String(id)) {
      throw new Error('Cannot create settings without an _id');
    }

    await this.getCollection().insertOne({ ...fields, _id: id });
    return this.get();
  }

  async deactivateSyncConfig(name: string): Promise<number> {
    const result = await this.getCollection().updateMany(
      {},
      { $set: { 'sync.$[c].active': false } },
      { arrayFilters: [{ 'c.name': name, 'c.active': true }] }
    );
    return result.modifiedCount;
  }

  protected async readLanguages(): Promise<SettingsType['languages']> {
    const settings = await this.getCollection().findOne({}, { projection: { languages: 1 } });
    return settings?.languages;
  }

  async getLanguageKeys() {
    const languages = await this.readLanguages();
    return languages?.map(l => l.key) || [];
  }

  async getDefaultLanguageKey() {
    const languages = await this.readLanguages();
    const defaultLanguage = languages?.find(l => l.default);
    if (!defaultLanguage) {
      throw new DefaultLanguageMissingError('Default language needs to be defined.');
    }
    return defaultLanguage.key;
  }

  async readNewRelationshipsAllowed(): Promise<boolean> {
    return Boolean(await this.readFeature('newRelationships'));
  }

  async readFilterUnauthorizedRelated(): Promise<boolean> {
    const settings = await this.getCollection().findOne(
      {},
      { projection: { filterUnauthorizedRelated: 1 } }
    );
    return !!settings?.filterUnauthorizedRelated;
  }

  async getNewRelationshipsConfiguration(): Promise<
    Exclude<Partial<Required<SettingsType>['features']['newRelationships']>, boolean | undefined>
  > {
    const featureConfiguration = await this.readFeature('newRelationships');

    if (typeof featureConfiguration === 'boolean' || !featureConfiguration) {
      return {};
    }

    if ('updateStrategy' in featureConfiguration) {
      return featureConfiguration;
    }

    return {};
  }

  async get(): Promise<SettingsType> {
    const settings = await this.readSettings();

    if (!settings) {
      throw new Error('Settings not found');
    }

    return settings;
  }
}

export type { MongoSettingsDataSourceDeps };
