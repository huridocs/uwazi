
import { LanguageISO6391, LanguagesListSchema } from 'shared/types/commonTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/settingsTyp... Remove this comment to see the full error message
import { Settings as SettingsType } from 'shared/types/settingsType.js';

export interface SettingsDataSource {
  getLanguageKeys(): Promise<LanguageISO6391[]>;
  getDefaultLanguageKey(): Promise<LanguageISO6391>;
  readNewRelationshipsAllowed(): Promise<boolean>;
  getInstalledLanguages(): Promise<LanguagesListSchema>;
  get(): Promise<SettingsType>;
}
