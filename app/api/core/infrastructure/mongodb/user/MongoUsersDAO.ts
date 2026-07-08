import { Db, Document, Filter, ObjectId } from 'mongodb';
import { MongoDataSource } from '../common/MongoDataSource.js';
import { Result } from '#api/core/libs/Result.js';
import type { ResultType } from '#api/core/libs/Result.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { UserDBO } from './UserDBO.js';
import { UserGroupDBO } from './UserGroupDBO.js';
import { PUBLIC_USER_ID } from '#api/core/domain/user/User.js';
import { UserNotFound } from '#api/core/domain/user/errors.js';

type UserGroup = { _id: string; name: string };
type UserWithGroups = UserDBO & { groups: UserGroup[] };

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
    const filter = {
      ...query,
      _id: { $ne: PUBLIC_USER_ID },
      deletedAt: { $exists: false },
    };

    const users = await this.getCollection()
      .find(filter, {
        projection: { _id: 1, username: 1, role: 1, email: 1, using2fa: 1, accountLocked: 1 },
      })
      .toArray();

    const userIds = users.map(user => user._id.toString());

    const groups = userIds.length
      ? await this.getCollection<UserGroupDBO>('usergroups')
          .find({ 'members.refId': { $in: userIds } })
          .toArray()
      : [];

    const usersWithGroups = users.map(user => ({
      ...user,
      groups: groups
        .filter(group => group.members.some(member => member.refId === user._id.toString()))
        .map(group => ({ _id: group._id.toString(), name: group.name })),
    }));

    return usersWithGroups;
  }
}

export { MongoUsersDAO };
