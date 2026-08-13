import { Db } from 'mongodb';
import {
  MongoDataSource,
  MongoDSOptions,
} from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import type { EnrichedUserGroup } from '#shared/contracts/UserGroups.js';
import { UserGroupDBO } from './UserGroupDBO.js';
import { MongoUsersDAO } from './MongoUsersDAO.js';
import { scopeFilters } from './UserReadOptions.js';

class MongoUserGroupsDAO extends MongoDataSource<UserGroupDBO> {
  protected collectionName = 'usergroups';

  private usersDAO: MongoUsersDAO;

  constructor(
    db: Db,
    transactionManager: TransactionManager,
    usersDAO: MongoUsersDAO,
    options?: MongoDSOptions
  ) {
    super(db, transactionManager, options);
    this.usersDAO = usersDAO;
  }

  async getAll(): Promise<EnrichedUserGroup[]> {
    const aggregation = [
      {
        $lookup: {
          from: 'users',
          let: { memberIds: '$members.refId' },
          pipeline: [
            {
              // The users guards come from UserReadOptions, the single definition of what
              // "excluded" means on this backend (D5) — not from a getGuards() method on
              // MongoUsersDAO, which would put guard composition back outside the DAO.
              $match: {
                $and: [
                  { $expr: { $in: [{ $toString: '$_id' }, '$$memberIds'] } },
                  ...scopeFilters(),
                ],
              },
            },
            { $project: { _id: { $toString: '$_id' }, username: 1, role: 1, email: 1 } },
          ],
          as: 'matchedUsers',
        },
      },
      {
        $project: {
          _id: { $toString: '$_id' },
          name: 1,
          members: {
            $map: {
              input: '$members',
              as: 'member',
              in: {
                $let: {
                  vars: {
                    matched: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$matchedUsers',
                            cond: { $eq: ['$$this._id', '$$member.refId'] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  in: {
                    $cond: [
                      { $ifNull: ['$$matched', false] },
                      {
                        refId: '$$member.refId',
                        username: '$$matched.username',
                        role: '$$matched.role',
                        email: '$$matched.email',
                      },
                      { refId: '$$member.refId' },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    ];

    return this.getCollection().aggregate<EnrichedUserGroup>(aggregation).toArray();
  }
}

export { MongoUserGroupsDAO };
