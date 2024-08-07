import { LanguageISO6391 } from 'shared/types/commonTypes';
import { AutomaticTranslationConfig } from 'shared/types/settingsType';

export interface SettingsDataSource {
  getLanguageKeys(): Promise<LanguageISO6391[]>;
  getDefaultLanguageKey(): Promise<LanguageISO6391>;
  getAutomaticTranslationConfig(): Promise<AutomaticTranslationConfig>;
  readNewRelationshipsAllowed(): Promise<boolean>;
}
