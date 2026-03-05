import { Db } from 'mongodb';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { MongoTransactionManager } from './common/MongoTransactionManager.js';
import { MongoSettingsDataSource } from './MongoSettingsDataSource.js';

export class CachedMongoSettingsDataSource extends MongoSettingsDataSource {
  private cache = new Map<string, any>();

  constructor(db: Db, transactionManager: MongoTransactionManager) {
    super(db, transactionManager);
    transactionManager.onCommitted(async () => {
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
