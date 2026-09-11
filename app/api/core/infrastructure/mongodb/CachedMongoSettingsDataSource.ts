import { LanguageISO6391, LanguagesListSchema } from '#shared/types/commonTypes.js';
import { MongoSettingsDataSource, MongoSettingsDataSourceDeps } from './MongoSettingsDataSource.js';

export class CachedMongoSettingsDataSource extends MongoSettingsDataSource {
  private cache = new Map<string, unknown>();

  constructor(deps: MongoSettingsDataSourceDeps) {
    super(deps);
    deps.transactionManager.onCommitted(async () => {
      this.cache.clear();
    });
  }

  override async getLanguageKeys(): Promise<LanguageISO6391[]> {
    const cached = this.cache.get('languageKeys');
    if (cached) {
      return cached as LanguageISO6391[];
    }
    const languageKeys = await super.getLanguageKeys();
    this.cache.set('languageKeys', languageKeys);
    return languageKeys;
  }

  override async readLanguages(): Promise<LanguagesListSchema | undefined> {
    if (this.cache.has('languages')) {
      return this.cache.get('languages') as LanguagesListSchema | undefined;
    }
    const languages = await super.readLanguages();
    this.cache.set('languages', languages);
    return languages;
  }
}
