import { MongoResultSet } from 'api/core/infrastructure/mongodb/common/MongoResultSet';
import { MongoTranslationsDataSource } from './MongoTranslationsDataSource';
import { TranslationDBO } from '../schemas/TranslationDBO';
import { Translation } from '../model/Translation';

export class CachedMongoTranslationsDataSource extends MongoTranslationsDataSource {
  private cache = new Map<string, any>();

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
