import { Db, Document, Filter, ObjectId, UpdateFilter } from 'mongodb';
import { MongoDataSource } from '../common/MongoDataSource.js';
import { Result } from '#api/core/libs/Result.js';
import type { ResultType } from '#api/core/libs/Result.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { UserDBO } from './UserDBO.js';
import { PUBLIC_USER_ID } from '#api/core/domain/user/User.js';
import { UserNotFound } from '#api/core/domain/user/errors.js';

const NOT_DELETED_FILTER: Filter<UserDBO> = { deletedAt: { $exists: false } };
const NOT_PUBLIC_USER_FILTER: Filter<UserDBO> = { _id: { $ne: PUBLIC_USER_ID } };

type UserWithGroups = UserDBO & { groups: { _id: string; name: string }[] };

type Deps = {
  db: Db;
  transactionManager: TransactionManager;
};

type QueryOptions = {
  projection?: Document;
  includeDeleted?: boolean;
};

type GetByIdOptions = {
  includePassword?: boolean;
  includeSecret?: boolean;
  includeFailedLogins?: boolean;
  includeAccountUnlockCode?: boolean;
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

  async getById(
    id: string,
    options: GetByIdOptions = {}
  ): Promise<ResultType<UserDBO, UserNotFound>> {
    const {
      includePassword,
      includeSecret,
      includeFailedLogins,
      includeAccountUnlockCode,
      includeDeleted,
    } = options;

    const projection: Document = {};
    if (!includePassword) projection.password = 0;
    if (!includeSecret) projection.secret = 0;
    if (!includeFailedLogins) projection.failedLogins = 0;
    if (!includeAccountUnlockCode) projection.accountUnlockCode = 0;

    const user = await this.findOne(
      { _id: ObjectId.createFromHexString(id) },
      { projection, includeDeleted }
    );

    if (!user) {
      return Result.fail(new UserNotFound(id));
    }

    return Result.ok(user);
  }

  async get(query: Filter<UserDBO> = {}): Promise<UserWithGroups[]> {
    const aggregation = [
      {
        $match: {
          ...query,
          ...NOT_PUBLIC_USER_FILTER,
          ...NOT_DELETED_FILTER,
        },
      },
      {
        $project: { _id: 1, username: 1, role: 1, email: 1, using2fa: 1, accountLocked: 1 },
      },
      {
        $lookup: {
          from: 'usergroups',
          let: { userId: { $toString: '$_id' } },
          pipeline: [
            { $match: { $expr: { $in: ['$$userId', '$members.refId'] } } },
            { $project: { _id: { $toString: '$_id' }, name: 1 } },
          ],
          as: 'groups',
        },
      },
    ];

    return this.getCollection().aggregate<UserWithGroups>(aggregation).toArray();
  }
}

export { MongoUsersDAO };
