import { ThesauriDataSource } from 'api/core/application/contracts/ThesauriDataSource';
import { Result, ResultType } from 'api/core/libs/Result';
import { Thesaurus } from 'api/core/domain/thesaurus/Thesaurus';
import { Db } from 'mongodb';
import { ThesaurusNameAlreadyExistsError } from 'api/core/domain/thesaurus/errors';
import { MongoDataSource } from '../common/MongoDataSource';
import { MongoThesaurusMapper } from './MongoThesaurusMapper';
import { ThesaurusDBO } from './ThesaurusDBO';
import { MongoTransactionManager } from '../common/MongoTransactionManager';

class MongoThesauriDataSourceV2
  extends MongoDataSource<ThesaurusDBO>
  implements ThesauriDataSource
{
  protected collectionName = 'dictionaries';

  constructor(db: Db, transactionManager: MongoTransactionManager) {
    super(db, transactionManager);
  }

  async create(thesaurus: Thesaurus): Promise<void> {
    const dbo = MongoThesaurusMapper.toDBO(thesaurus);

    await this.getCollection().insertOne(dbo, { ignoreUndefined: true });
  }

  async exists(name: string): Promise<ResultType<false, Error>> {
    const count = await this.getCollection().countDocuments({ name }, { limit: 1 });

    if (count > 0) {
      return Result.fail(new ThesaurusNameAlreadyExistsError(name));
    }

    return Result.ok(false);
  }
}

export { MongoThesauriDataSourceV2 };
