import { Db } from 'mongodb';
import { MongoResultSet } from '#api/core/infrastructure/mongodb/common/MongoResultSet.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoTranslationsDataSource } from './MongoTranslationsDataSource.js';
import { TranslationDBO } from '#api/core/infrastructure/mongodb/translation/schemas/TranslationDBO.js';
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

  private wrap(
    cacheKey: string,
    resultSet: MongoResultSet<TranslationDBO, Translation>
  ): MongoResultSet<TranslationDBO, Translation> {
    return {
      ...resultSet,
      all: async () => {
        const cached = this.cache.get(cacheKey);
        if (cached) {
          return cached;
        }
        const all = await resultSet.all();
        this.cache.set(cacheKey, all);
        return all;
      },
    } as MongoResultSet<TranslationDBO, Translation>;
  }

  override getByContext(context: string) {
    return this.wrap(`context:${context}`, super.getByContext(context));
  }

  override getByLanguage(language: LanguageISO6391) {
    return this.wrap(`language:${language}`, super.getByLanguage(language));
  }

  override getByLanguageExcludingContextTypes(
    language: LanguageISO6391,
    types: Translation['context']['type'][]
  ) {
    return this.wrap(
      `language-excluding:${language}:${types.join(',')}`,
      super.getByLanguageExcludingContextTypes(language, types)
    );
  }

  override getByLanguageAndContext(language: LanguageISO6391, contextId: string) {
    return this.wrap(
      `language+context:${language}:${contextId}`,
      super.getByLanguageAndContext(language, contextId)
    );
  }
}
