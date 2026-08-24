import { Db } from 'mongodb';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoTranslationsDataSource } from './MongoTranslationsDataSource.js';
import { Translation } from '#api/core/domain/translation/Translation.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';

/**
 * Request/use-case scoped cache (same pattern as CachedMongoTemplatesDataSource).
 * Lives on this instance only; not shared across Node processes or tenants.
 */
export class CachedMongoTranslationsDataSource extends MongoTranslationsDataSource {
  private cache = new Map<string, Translation[]>();

  constructor(db: Db, transactionManager: MongoTransactionManager) {
    super(db, transactionManager);
    transactionManager.onCommitted(async () => {
      this.cache.clear();
    });
  }

  private async wrap(cacheKey: string, load: () => Promise<Translation[]>): Promise<Translation[]> {
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const all = await load();
    this.cache.set(cacheKey, all);
    return all;
  }

  override async getByContext(context: string) {
    return this.wrap(`context:${context}`, async () => super.getByContext(context));
  }

  override async getByLanguage(language: LanguageISO6391) {
    return this.wrap(`language:${language}`, async () => super.getByLanguage(language));
  }

  override async getByLanguageExcludingContextTypes(
    language: LanguageISO6391,
    types: Translation['context']['type'][]
  ) {
    return this.wrap(`language-excluding:${language}:${types.join(',')}`, async () =>
      super.getByLanguageExcludingContextTypes(language, types)
    );
  }

  override async getByLanguageAndContext(language: LanguageISO6391, contextId: string) {
    return this.wrap(`language+context:${language}:${contextId}`, async () =>
      super.getByLanguageAndContext(language, contextId)
    );
  }
}
