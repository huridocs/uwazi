import { Db, Filter } from 'mongodb';
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
          ...this.dao.notPublicUserFilter(),
          ...this.dao.notDeletedFilter(),
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

export { MongoUsersQueryService };
