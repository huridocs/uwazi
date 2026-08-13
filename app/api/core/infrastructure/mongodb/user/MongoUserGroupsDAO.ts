import { Db } from 'mongodb';
import {
  MongoDataSource,
  MongoDSOptions,
} from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import type { EnrichedUserGroup } from '#shared/contracts/UserGroups.js';
import { UserGroupDBO } from './UserGroupDBO.js';
import { scopeFilters } from './UserReadOptions.js';

class MongoUserGroupsDAO extends MongoDataSource<UserGroupDBO> {
  protected collectionName = 'usergroups';

  constructor(db: Db, transactionManager: TransactionManager, options?: MongoDSOptions) {
    super(db, transactionManager, options);
  }

  /**
   * Groups keyed by member id. Mirrors PostgresUserGroupsDAO.getGroupsByUserIds exactly —
   * same signature, same Map semantics, same pre-seeded empty arrays — because the two
   * Directory implementations use it interchangeably for getProfile/getActor, which resolve
   * a single user and cannot reuse findWithGroups's list-shaped query economically.
   */
  async getGroupsByUserIds(
    userIds: string[]
  ): Promise<Map<string, { _id: string; name: string }[]>> {
    // Pre-seeded so every requested id has an entry — callers rely on `map.get(id) ?? []`
    // never distinguishing "no groups" from "not asked for".
    const map = new Map<string, { _id: string; name: string }[]>(userIds.map(id => [id, []]));
    if (!userIds.length) return map;

    // Filtered in the query, not by loading the collection.
    const groups = await this.getCollection()
      .find({ 'members.refId': { $in: userIds } }, { projection: { _id: 1, name: 1, members: 1 } })
      .toArray();

    groups.forEach(group => {
      group.members.forEach(member => {
        map.get(member.refId)?.push({ _id: group._id.toString(), name: group.name });
      });
    });

    return map;
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
