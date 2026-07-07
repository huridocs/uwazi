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

class MongoUsersDAO extends MongoDataSource<UserDBO> {
  protected collectionName = 'users';

  constructor(deps: Deps) {
    super(deps.db, deps.transactionManager);
  }

  async getById(
    id: string,
    projection?: Document,
    includeDeleted = false
  ): Promise<ResultType<UserDBO, UserNotFound>> {
    const filter: Filter<UserDBO> = { _id: new ObjectId(id) };

    if (!includeDeleted) {
      filter.deletedAt = { $exists: false };
    }

    const dbo = await this.getCollection().findOne(filter, { projection });

    if (!dbo) {
      return Result.fail(new UserNotFound(id));
    }

    return Result.ok(dbo);
  }

  async get(query: Filter<UserDBO> = {}, projection?: Document): Promise<UserWithGroups[]> {
    const filter = {
      ...query,
      _id: { $ne: PUBLIC_USER_ID },
      deletedAt: { $exists: false },
    };

    const users = await this.getCollection().find(filter, { projection }).toArray();

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
