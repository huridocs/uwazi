import { Db } from 'mongodb';
import { MongoResultSet } from '#api/core/infrastructure/mongodb/common/MongoResultSet.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { MongoTranslationsDataSource } from '#api/i18n.v2/database/MongoTranslationsDataSource.js';
import { TranslationDBO } from '#api/i18n.v2/schemas/TranslationDBO.js';
import { Translation } from '#api/i18n.v2/model/Translation.js';

export class CachedMongoTranslationsDataSource extends MongoTranslationsDataSource {
  private cache = new Map<string, any>();

  constructor(db: Db, transactionManager: MongoTransactionManager) {
    super(db, transactionManager);
    transactionManager.onCommitted(async () => {
      this.cache.clear();
    });
  }

  override getByContext(context: string) {
    const resultSet = super.getByContext(context);

    return {
      ...resultSet,
      all: async () => {
        if (this.cache.has(context)) {
          return this.cache.get(context);
        }

        const all = await resultSet.all();
        this.cache.set(context, all);
        return all;
      },
    } as MongoResultSet<TranslationDBO, Translation>;
  }
}
