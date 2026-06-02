import { Db, ObjectId } from 'mongodb';
import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { Result, ResultType } from '#api/core/libs/Result.js';
import { Thesaurus } from '#api/core/domain/thesaurus/Thesaurus.js';
import {
  ThesaurusNameAlreadyExistsError,
  ThesaurusNotFoundError,
} from '#api/core/domain/thesaurus/errors.js';
import { MongoDataSource } from '../common/MongoDataSource.js';
import { MongoThesaurusMapper } from './MongoThesaurusMapper.js';
import { ThesaurusDBO } from './ThesaurusDBO.js';
import { MongoTransactionManager } from '../common/MongoTransactionManager.js';

class MongoThesauriDataSource extends MongoDataSource<ThesaurusDBO> implements ThesauriDataSource {
  protected collectionName = 'dictionaries';

  constructor(db: Db, transactionManager: MongoTransactionManager) {
    super(db, transactionManager);
  }

  async update(thesaurus: Thesaurus): Promise<void> {
    const dbo = MongoThesaurusMapper.toDBO(thesaurus);

    await this.getCollection().updateOne(
      { _id: new ObjectId(thesaurus.id) },
      { $set: dbo },
      { ignoreUndefined: true }
    );
  }

  async getById(id: string): Promise<ResultType<Thesaurus, ThesaurusNotFoundError>> {
    const dbo = await this.getCollection().findOne({ _id: ObjectId.createFromHexString(id) });
    if (!dbo) {
      return Result.fail(new ThesaurusNotFoundError(id));
    }

    const thesaurus = MongoThesaurusMapper.toDomain(dbo, false);

    return Result.ok(thesaurus);
  }

  async create(thesaurus: Thesaurus): Promise<void> {
    const dbo = MongoThesaurusMapper.toDBO(thesaurus);

    await this.getCollection().insertOne(dbo, { ignoreUndefined: true });
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.getCollection().countDocuments(
      { _id: ObjectId.createFromHexString(id) },
      { limit: 1 }
    );
    return count > 0;
  }

  async exists(thesaurus: Thesaurus): Promise<ResultType<false, Error>> {
    const count = await this.getCollection().countDocuments(
      { name: thesaurus.name, _id: { $ne: new ObjectId(thesaurus.id) } },
      { limit: 1 }
    );

    if (count > 0) {
      return Result.fail(new ThesaurusNameAlreadyExistsError(thesaurus.name));
    }

    return Result.ok(false);
  }
}

export { MongoThesauriDataSource };
