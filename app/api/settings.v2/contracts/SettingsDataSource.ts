import { Transactional } from 'api/common.v2/contracts/Transactional';

export interface SettingsDataSource extends Transactional {
  getLanguageKeys(): Promise<string[]>;
  getDefaultLanguageKey(): Promise<string>;
}
