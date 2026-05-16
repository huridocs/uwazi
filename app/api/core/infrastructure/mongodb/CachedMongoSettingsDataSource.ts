import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { MongoSettingsDataSource, MongoSettingsDataSourceDeps } from './MongoSettingsDataSource.js';

export class CachedMongoSettingsDataSource extends MongoSettingsDataSource {
  private cache = new Map<string, any>();

  constructor(deps: MongoSettingsDataSourceDeps) {
    super(deps);
    deps.transactionManager.onCommitted(async () => {
      this.cache.clear();
    });
  }

  override async getLanguageKeys(): Promise<LanguageISO6391[]> {
    if (this.cache.has('languageKeys')) {
      return this.cache.get('languageKeys');
    }

    const languageKeys = await super.getLanguageKeys();
    this.cache.set('languageKeys', languageKeys);

    return languageKeys;
  }
}
