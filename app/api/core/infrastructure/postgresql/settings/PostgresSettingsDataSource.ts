import { Db } from 'mongodb';
import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { Settings } from '#api/core/domain/settings/Settings.js';
import { DefaultLanguageMissingError } from '#api/core/infrastructure/mongodb/errors/settingsErrors.js';
import { LanguageUtils } from '#shared/language/index.js';
import { LanguageISO6391, LanguageSchema, LanguagesListSchema } from '#shared/types/commonTypes.js';
import { Settings as SettingsType } from '#shared/types/settingsType.js';
import { PostgresDataSource } from '../common/PostgresDataSource.js';
import { PostgresTransactionManager } from '../common/PostgresTransactionManager.js';
import { PostgresSettingsMapper, SettingsRow } from './PostgresSettingsMapper.js';

const withExtras = (row: SettingsRow): SettingsRow => ({
  ...row,
  extras: row.extras ?? {},
});

export class PostgresSettingsDataSource
  extends PostgresDataSource<SettingsRow>
  implements SettingsDataSource
{
  private readonly idGenerator: IdGenerator;

  constructor(deps: {
    tenantId: string;
    mongoDb: Db;
    pgTransactionManager: PostgresTransactionManager;
    idGenerator: IdGenerator;
  }) {
    super('settings', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
      sync: { syncDb: deps.mongoDb, syncNamespace: 'settings' },
    });
    this.idGenerator = deps.idGenerator;
  }

  async find(): Promise<Settings | null> {
    const row = await this.table.first();
    return row ? new Settings(PostgresSettingsMapper.toSettings(withExtras(row))) : null;
  }

  async get(): Promise<Settings> {
    const settings = await this.find();
    if (!settings) {
      throw new Error('Settings not found');
    }
    return settings;
  }

  async update(settings: Settings): Promise<Settings> {
    const current = await this.find();
    const state = settings.toState();
    const { _id: incomingId, __v: _version, ...fields } = state;

    if (current?._id) {
      await this.writeRow({ ...current.toState(), ...fields, _id: current._id });
      return this.get();
    }

    const id =
      incomingId != null && String(incomingId) ? String(incomingId) : this.idGenerator.generate();
    await this.writeRow({ ...fields, _id: id });
    return this.get();
  }

  async readPresentation(): Promise<Settings | null> {
    const row = await this.table.select(PostgresSettingsMapper.presentationColumnNames()).first();
    return row ? new Settings(PostgresSettingsMapper.toSettings(withExtras(row))) : null;
  }

  private async readSlice<K extends keyof SettingsType>(
    fields: readonly K[]
  ): Promise<(Pick<SettingsType, K> & { _id?: SettingsType['_id'] }) | null> {
    const columns = [
      '_id',
      ...fields.map(field => PostgresSettingsMapper.columnForField(field) ?? 'extras'),
    ];
    const uniqueColumns = [...new Set(columns)];
    const row = await this.table.select(uniqueColumns).first();
    if (!row) {
      return null;
    }
    const mapped = PostgresSettingsMapper.toSettings(withExtras(row));
    const picked = { _id: mapped._id } as Pick<SettingsType, K> & { _id?: SettingsType['_id'] };
    fields.forEach(field => {
      if (mapped[field] !== undefined) {
        picked[field] = mapped[field];
      }
    });
    return picked;
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
    const fields = await this.readSlice(['features']);
    return fields?.features?.[name];
  }

  async readSyncConfig(): Promise<SettingsType['sync']> {
    const fields = await this.readSlice(['sync']);
    return fields?.sync;
  }

  async getLanguageKeys(): Promise<LanguageISO6391[]> {
    const languages = await this.readLanguages();
    return languages?.map(language => language.key) || [];
  }

  async getDefaultLanguageKey(): Promise<LanguageISO6391> {
    const languages = await this.readLanguages();
    const defaultLanguage = languages?.find(language => language.default);
    if (!defaultLanguage) {
      throw new DefaultLanguageMissingError();
    }
    return defaultLanguage.key;
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

  async readNewRelationshipsAllowed(): Promise<boolean> {
    return Boolean(await this.readFeature('newRelationships'));
  }

  async readFilterUnauthorizedRelated(): Promise<boolean> {
    const fields = await this.readSlice(['filterUnauthorizedRelated']);
    return !!fields?.filterUnauthorizedRelated;
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

  private async writeRow(settings: SettingsType) {
    await this.table.upsert(
      PostgresSettingsMapper.toRow(settings, () => this.idGenerator.generate()),
      { columns: ['tenant_id'] }
    );
  }
}
