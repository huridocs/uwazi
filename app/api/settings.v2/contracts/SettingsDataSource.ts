import { LanguageISO6391, LanguagesListSchema } from 'shared/types/commonTypes';
import { Settings as SettingsType } from 'shared/types/settingsType';

export interface SettingsDataSource {
  getLanguageKeys(): Promise<LanguageISO6391[]>;
  getDefaultLanguageKey(): Promise<LanguageISO6391>;
  readNewRelationshipsAllowed(): Promise<boolean>;
  getInstalledLanguages(): Promise<LanguagesListSchema>;
  get(): Promise<SettingsType>;
}
