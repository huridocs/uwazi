import { Db, Document, Filter, ObjectId, UpdateFilter } from 'mongodb';
import { MongoDataSource } from '../common/MongoDataSource.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { UserDBO } from './UserDBO.js';
import { PUBLIC_USER_ID } from '#api/core/domain/user/User.js';

const NOT_DELETED_FILTER: Filter<UserDBO> = { deletedAt: { $exists: false } };
const NOT_PUBLIC_USER_FILTER: Filter<UserDBO> = { _id: { $ne: PUBLIC_USER_ID } };

type Deps = {
  db: Db;
  transactionManager: TransactionManager;
};

type QueryOptions = {
  projection?: Document;
  includeDeleted?: boolean;
};

class MongoUsersDAO extends MongoDataSource<UserDBO> {
  protected collectionName = 'users';

  constructor(deps: Deps) {
    super(deps.db, deps.transactionManager);
  }

  // eslint-disable-next-line class-methods-use-this
  notDeletedFilter(): Filter<UserDBO> {
    return NOT_DELETED_FILTER;
  }

  // eslint-disable-next-line class-methods-use-this
  notPublicUserFilter(): Filter<UserDBO> {
    return NOT_PUBLIC_USER_FILTER;
  }

  async findOne(filter: Filter<UserDBO>, options: QueryOptions = {}): Promise<UserDBO | null> {
    const { projection, includeDeleted } = options;
    const guardedFilter = includeDeleted ? filter : { ...filter, ...NOT_DELETED_FILTER };
    return this.getCollection<UserDBO>().findOne(guardedFilter, { projection });
  }

  async exists(filter: Filter<UserDBO>): Promise<boolean> {
    const user = await this.findOne(
      { ...filter, ...NOT_PUBLIC_USER_FILTER },
      { projection: { _id: 1 } }
    );
    return Boolean(user);
  }

  async count(filter: Filter<UserDBO> = {}): Promise<number> {
    const guardedFilter = { ...filter, ...NOT_DELETED_FILTER } as Document;
    return this.getCollection<UserDBO>().countDocuments(guardedFilter);
  }

  async updateOne(
    filter: Filter<UserDBO>,
    update: UpdateFilter<UserDBO> | Partial<UserDBO>,
    options: { includeDeleted?: boolean } = {}
  ): Promise<void> {
    const guardedFilter = options.includeDeleted ? filter : { ...filter, ...NOT_DELETED_FILTER };
    await this.getCollection<UserDBO>().updateOne(guardedFilter, update);
  }

  async insertOne(dbo: UserDBO): Promise<void> {
    await this.getCollection<UserDBO>().insertOne(dbo);
  }

  async softDelete(ids: string[]): Promise<number> {
    if (!ids.length) {
      return 0;
    }

    const result = await this.getCollection<UserDBO>().updateMany(
      { _id: { $in: ids.map(id => ObjectId.createFromHexString(id)) } },
      { $set: { deletedAt: new Date() } }
    );

    return result.modifiedCount;
  }
}

export { MongoUsersDAO };
