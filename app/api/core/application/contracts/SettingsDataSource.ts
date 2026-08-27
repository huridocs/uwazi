import { LanguageISO6391, LanguageSchema, LanguagesListSchema } from '#shared/types/commonTypes.js';
import { Settings as SettingsType } from '#shared/types/settingsType.js';

export interface SettingsDataSource {
  getLanguageKeys(): Promise<LanguageISO6391[]>;
  addLanguage(language: LanguageSchema): Promise<void>;
  setLanguageInstalling(key: LanguageISO6391, installing: boolean): Promise<void>;
  deleteLanguage(key: LanguageISO6391): Promise<void>;
  getDefaultLanguageKey(): Promise<LanguageISO6391>;
  readNewRelationshipsAllowed(): Promise<boolean>;
  readFilterUnauthorizedRelated(): Promise<boolean>;
  getInstalledLanguages(): Promise<LanguagesListSchema>;
  find(): Promise<SettingsType | null>;
  get(): Promise<SettingsType>;
  patch(partial: SettingsType): Promise<SettingsType>;
  deactivateSyncConfig(name: string): Promise<number>;
  readFields<K extends keyof SettingsType>(
    fields: readonly K[]
  ): Promise<(Pick<SettingsType, K> & { _id?: SettingsType['_id'] }) | null>;
  readFeature<K extends keyof NonNullable<SettingsType['features']>>(
    name: K
  ): Promise<NonNullable<SettingsType['features']>[K] | undefined>;
  getSyncConfig(): Promise<SettingsType['sync']>;
  getNewRelationshipsConfiguration(): Promise<
    Exclude<Partial<Required<SettingsType>['features']['newRelationships']>, boolean | undefined>
  >;
}
