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
  get(): Promise<SettingsType>;
  getNewRelationshipsConfiguration(): Promise<
    Exclude<Partial<Required<SettingsType>['features']['newRelationships']>, boolean | undefined>
  >;
}
