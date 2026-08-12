import { Db, Filter } from 'mongodb';
import escapeRegExp from 'lodash/escapeRegExp.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { MongoDataSource } from '../common/MongoDataSource.js';
import { UserDBO } from './UserDBO.js';
import { MongoUsersDAO } from './MongoUsersDAO.js';

type UserWithGroups = UserDBO & { groups: { _id: string; name: string }[] };

type Deps = {
  db: Db;
  transactionManager: TransactionManager;
  dao: MongoUsersDAO;
};

class MongoUsersQueryService extends MongoDataSource<UserDBO> {
  protected collectionName = 'users';

  private dao: MongoUsersDAO;

  constructor(deps: Deps) {
    super(deps.db, deps.transactionManager);
    this.dao = deps.dao;
  }

  async listWithGroups(query: Filter<UserDBO> = {}): Promise<UserWithGroups[]> {
    const aggregation = [
      {
        $match: {
          ...query,
          ...this.dao.getGuards(),
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

  async listBasicInfo(): Promise<{ _id: string; username: string }[]> {
    const users = await this.dao.findMany(this.dao.notPublicUserFilter());

    return users.map(user => ({ _id: user._id.toString(), username: user.username }));
  }

  async findByEmailOrUsername(
    term: string
  ): Promise<{ _id: string; username: string; email: string }[]> {
    const exactRegex = new RegExp(`^${escapeRegExp(term)}$`, 'i');
    const users = await this.dao.findMany({
      $or: [{ username: exactRegex }, { email: exactRegex }],
      ...this.dao.notPublicUserFilter(),
    });

    return users.map(user => ({
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
    }));
  }
}

export { MongoUsersQueryService };
