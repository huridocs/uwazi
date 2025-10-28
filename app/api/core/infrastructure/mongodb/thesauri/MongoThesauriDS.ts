import { Result, ResultType } from 'api/core/libs/Result';
import thesauri from 'api/thesauri';
import { ObjectId } from 'mongodb';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { MongoDataSource } from '../common/MongoDataSource';

// Todo: This will eventually got removed from here to domain folder.
interface ThesauriDataSource {
  exists(id: string): Promise<boolean>;
  getById(id: string): Promise<ResultType<ThesaurusSchema, Error>>;
}

class MongoThesauriDataSource
  extends MongoDataSource<ThesaurusSchema>
  implements ThesauriDataSource
{
  protected collectionName = 'dictionaries';

  async exists(id: string): Promise<boolean> {
    const doc = await thesauri.getById(id);

    return Boolean(doc);
  }

  async getById(id: string): Promise<ResultType<ThesaurusSchema, Error>> {
    const doc = await this.getCollection().findOne({ _id: ObjectId.createFromHexString(id) });

    if (!doc) {
      return Result.fail(new Error(`Thesaurus value of id ${id} not found`));
    }

    return Result.ok(doc);
  }
}

export { MongoThesauriDataSource };

export type { ThesauriDataSource };
