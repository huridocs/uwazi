import { Db } from 'mongodb';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
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
  constructor(deps: {
    tenantId: string;
    mongoDb: Db;
    pgTransactionManager: PostgresTransactionManager;
  }) {
    super('settings', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
      sync: { syncDb: deps.mongoDb, syncNamespace: 'settings' },
    });
  }

  async find(): Promise<SettingsType | null> {
    const row = await this.table.first();
    return row ? PostgresSettingsMapper.toSettings(withExtras(row)) : null;
  }

  async get(): Promise<SettingsType> {
    const settings = await this.find();
    if (!settings) {
      throw new Error('Settings not found');
    }
    return settings;
  }

  async patch(partial: SettingsType): Promise<SettingsType> {
    const current = await this.find();
    const { _id: incomingId, __v: _version, ...fields } = partial;

    if (current?._id) {
      await this.writeRow({ ...current, ...fields, _id: current._id });
      return this.get();
    }

    const id = incomingId != null ? String(incomingId) : '';
    if (!id) {
      throw new Error('Cannot create settings without an _id');
    }

    await this.writeRow({ ...fields, _id: id });
    return this.get();
  }

  async readFields<K extends keyof SettingsType>(
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

    const settings = PostgresSettingsMapper.toSettings(withExtras(row));
    const picked = { _id: settings._id } as Pick<SettingsType, K> & { _id?: SettingsType['_id'] };
    fields.forEach(field => {
      if (settings[field] !== undefined) {
        picked[field] = settings[field];
      }
    });
    return picked;
  }

  async readFeature<K extends keyof NonNullable<SettingsType['features']>>(
    name: K
  ): Promise<NonNullable<SettingsType['features']>[K] | undefined> {
    const fields = await this.readFields(['features']);
    return fields?.features?.[name];
  }

  async readSyncConfig(): Promise<SettingsType['sync']> {
    const fields = await this.readFields(['sync']);
    return fields?.sync;
  }

  async addLanguage(language: LanguageSchema): Promise<void> {
    const current = await this.requireSettings();
    const languages = current.languages ?? [];
    if (languages.some(item => item.key === language.key)) {
      return;
    }
    await this.patch({ languages: [...languages, language] });
  }

  async setLanguageInstalling(key: LanguageISO6391, installing: boolean): Promise<void> {
    const current = await this.requireSettings();
    await this.patch({
      languages: (current.languages ?? []).map(language =>
        language.key === key ? { ...language, installing } : language
      ),
    });
  }

  async deleteLanguage(key: LanguageISO6391): Promise<void> {
    const current = await this.requireSettings();
    await this.patch({
      languages: (current.languages ?? []).filter(language => language.key !== key),
    });
  }

  async getLanguageKeys(): Promise<LanguageISO6391[]> {
    const languages = await this.readLanguages();
    return languages?.map(language => language.key) || [];
  }

  async getDefaultLanguageKey(): Promise<LanguageISO6391> {
    const languages = await this.readLanguages();
    const defaultLanguage = languages?.find(language => language.default);
    if (!defaultLanguage) {
      throw new DefaultLanguageMissingError('Default language needs to be defined.');
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
    const fields = await this.readFields(['filterUnauthorizedRelated']);
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

  async deactivateSyncConfig(name: string): Promise<number> {
    const current = await this.find();
    const sync = current?.sync ?? [];
    let modified = 0;
    const next = sync.map(config => {
      if (config.name === name && config.active) {
        modified += 1;
        return { ...config, active: false };
      }
      return config;
    });
    if (modified) {
      await this.patch({ sync: next });
    }
    return modified;
  }

  private async writeRow(settings: SettingsType) {
    await this.table.upsert(PostgresSettingsMapper.toRow(settings), { columns: ['tenant_id'] });
  }

  private async requireSettings(): Promise<SettingsType> {
    return this.get();
  }

  private async readLanguages(): Promise<SettingsType['languages']> {
    const fields = await this.readFields(['languages']);
    return fields?.languages;
  }
}
