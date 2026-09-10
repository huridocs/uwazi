import { Db, ObjectId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import { LanguageUtils } from '#shared/language/index.js';
import { LanguageSchema, LanguagesListSchema } from '#shared/types/commonTypes.js';
import { Settings as SettingsType } from '#shared/types/settingsType.js';
import { Settings } from '#api/core/domain/settings/Settings.js';
import { SettingsDataSource } from '../../application/contracts/SettingsDataSource.js';
import { toPersistableSettingsFields } from '../settings/persistableSettingsFields.js';
import { DefaultLanguageMissingError } from './errors/settingsErrors.js';
import { MongoTransactionManager } from './common/MongoTransactionManager.js';

type MongoSettingsDataSourceDeps = {
  db: Db;
  transactionManager: MongoTransactionManager;
};

const resolveInsertId = (incomingId: SettingsType['_id']): ObjectId => {
  if (incomingId instanceof ObjectId) {
    return incomingId;
  }
  if (incomingId != null && String(incomingId)) {
    return MongoIdHandler.mapToDb(String(incomingId));
  }
  return new ObjectId();
};

export class MongoSettingsDataSource
  extends MongoDataSource<SettingsType>
  implements SettingsDataSource
{
  protected collectionName = 'settings';

  constructor(deps: MongoSettingsDataSourceDeps) {
    super(deps.db, deps.transactionManager);
  }

  protected async readSettings(): Promise<SettingsType | null> {
    return this.getCollection().findOne({});
  }

  private async readSlice<K extends keyof SettingsType>(
    fields: readonly K[]
  ): Promise<(Pick<SettingsType, K> & { _id?: SettingsType['_id'] }) | null> {
    const projection = Object.fromEntries(fields.map(field => [field, 1])) as Record<string, 1>;
    return this.getCollection().findOne({}, { projection });
  }

  async find(): Promise<Settings | null> {
    const document = await this.readSettings();
    return document ? new Settings(document) : null;
  }

  async get(): Promise<Settings> {
    const settings = await this.find();
    if (!settings) {
      throw new Error('Settings not found');
    }
    return settings;
  }

  async update(settings: Settings): Promise<Settings> {
    const {
      _id: incomingId,
      __v: _version,
      ...fields
    } = toPersistableSettingsFields(settings.toState());
    const current = await this.readSettings();

    if (current?._id) {
      if (Object.keys(fields).length) {
        await this.getCollection().updateOne({ _id: current._id }, { $set: fields });
      }
      return this.get();
    }

    return this.insertSingleton(incomingId, fields);
  }

  async readPresentation(): Promise<Settings | null> {
    const document = await this.getCollection().findOne({}, { projection: { sync: 0 } });
    return document ? new Settings(document) : null;
  }

  async readLanguages(): Promise<LanguagesListSchema | undefined> {
    return (await this.readSlice(['languages']))?.languages;
  }

  async readNewNameGeneration(): Promise<boolean> {
    return Boolean((await this.readSlice(['newNameGeneration']))?.newNameGeneration);
  }

  async readOpenPublicEndpoint(): Promise<boolean> {
    return Boolean((await this.readSlice(['openPublicEndpoint']))?.openPublicEndpoint);
  }

  async readOcrServiceEnabled(): Promise<boolean> {
    return Boolean((await this.readSlice(['ocrServiceEnabled']))?.ocrServiceEnabled);
  }

  async readAllowedPublicTemplates(): Promise<SettingsType['allowedPublicTemplates']> {
    return (await this.readSlice(['allowedPublicTemplates']))?.allowedPublicTemplates;
  }

  async readContactMail() {
    const slice = await this.readSlice(['contactEmail', 'senderEmail', 'site_name']);
    return {
      contactEmail: slice?.contactEmail,
      senderEmail: slice?.senderEmail,
      site_name: slice?.site_name,
    };
  }

  async readExportFormat() {
    const slice = await this.readSlice(['dateFormat', 'site_name']);
    return { dateFormat: slice?.dateFormat, site_name: slice?.site_name };
  }

  async readPublicFormDestination(): Promise<string | undefined> {
    return (await this.readSlice(['publicFormDestination']))?.publicFormDestination;
  }

  async readMailerConfig(): Promise<string | undefined> {
    return (await this.readSlice(['mailerConfig']))?.mailerConfig;
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

  async getLanguageKeys() {
    const languages = await this.readLanguages();
    return languages?.map(l => l.key) || [];
  }

  async getDefaultLanguageKey() {
    const languages = await this.readLanguages();
    const defaultLanguage = languages?.find(l => l.default);
    if (!defaultLanguage) {
      throw new DefaultLanguageMissingError();
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

  private async insertSingleton(
    incomingId: SettingsType['_id'],
    fields: Omit<SettingsType, '_id' | '__v'>
  ): Promise<Settings> {
    const id = resolveInsertId(incomingId);
    await this.getCollection().insertOne({ ...fields, _id: id });
    return this.get();
  }
}

export type { MongoSettingsDataSourceDeps };
