import { LanguageISO6391 } from 'shared/types/commonTypes';
import { MongoSettingsDataSource } from './MongoSettingsDataSource';

export class CachedMongoSettingsDataSource extends MongoSettingsDataSource {
  private cache = new Map<string, any>();

  override async getLanguageKeys(): Promise<LanguageISO6391[]> {
    if (this.cache.has('languageKeys')) {
      return this.cache.get('languageKeys');
    }

    const languageKeys = await super.getLanguageKeys();
    this.cache.set('languageKeys', languageKeys);

    return languageKeys;
  }
}
