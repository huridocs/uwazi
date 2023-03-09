import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { TranslationsDataSource } from '../contracts/TranslationsDataSource';
import { TranslationMappers } from '../database/TranslationMappers';
import { Translation } from '../model/Translation';
import { TranslationDBO } from '../schemas/TranslationDBO';

export class MongoTranslationsDataSource
  extends MongoDataSource<TranslationDBO>
  implements TranslationsDataSource
{
  protected collectionName = 'translations_v2';

  async insert(translations: Translation[]): Promise<Translation[]> {
    const items = translations.map(translation => TranslationMappers.toDBO(translation));
    await this.getCollection().insertMany(items, {
      session: this.getSession(),
    });

    return translations;
  }

  getAll() {
    return new MongoResultSet<TranslationDBO, Translation>(
      this.getCollection().find(),
      TranslationMappers.toModel
    );
  }
}
