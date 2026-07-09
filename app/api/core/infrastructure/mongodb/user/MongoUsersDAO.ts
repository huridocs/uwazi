import { Db, Document, Filter, ObjectId } from 'mongodb';
import { MongoDataSource } from '../common/MongoDataSource.js';
import { Result } from '#api/core/libs/Result.js';
import type { ResultType } from '#api/core/libs/Result.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { UserDBO } from './UserDBO.js';
import { PUBLIC_USER_ID } from '#api/core/domain/user/User.js';
import { UserNotFound } from '#api/core/domain/user/errors.js';

type UserWithGroups = UserDBO & { groups: { _id: string; name: string }[] };

type Deps = {
  db: Db;
  transactionManager: TransactionManager;
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

  // eslint-disable-next-line max-statements
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
    const filter: Filter<UserDBO> = { _id: new ObjectId(id) };

    if (!includeDeleted) {
      filter.deletedAt = { $exists: false };
    }

    const projection: Document = {};
    if (!includePassword) projection.password = 0;
    if (!includeSecret) projection.secret = 0;
    if (!includeFailedLogins) projection.failedLogins = 0;
    if (!includeAccountUnlockCode) projection.accountUnlockCode = 0;

    const user = await this.getCollection().findOne(filter, {
      projection: Object.keys(projection).length ? projection : undefined,
    });

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
          _id: { $ne: PUBLIC_USER_ID },
          deletedAt: { $exists: false },
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

    const results = await this.getCollection().aggregate<UserWithGroups>(aggregation).toArray();

    return results;
  }
}

export { MongoUsersDAO };
