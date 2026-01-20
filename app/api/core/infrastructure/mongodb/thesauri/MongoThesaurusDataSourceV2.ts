import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { Result, ResultType } from '#api/core/libs/Result.js';
import { Thesaurus } from '#api/core/domain/thesaurus/Thesaurus.js';
import { Db } from 'mongodb';
import { ThesaurusNameAlreadyExistsError } from '#api/core/domain/thesaurus/errors.js';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoThesaurusMapper } from '#api/core/infrastructure/mongodb/thesauri/MongoThesaurusMapper.js';
import { ThesaurusDBO } from '#api/core/infrastructure/mongodb/thesauri/ThesaurusDBO.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';

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
