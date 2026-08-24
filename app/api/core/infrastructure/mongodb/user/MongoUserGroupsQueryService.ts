import type { Document } from 'mongodb';
import type { UserGroupsQueryService } from '#api/core/application/contracts/UserGroupsQueryService.js';
import type { UserGroupWithMembers } from '#api/core/application/contracts/UserGroupReadModels.js';
import { MongoUserGroupsDAO } from './MongoUserGroupsDAO.js';
import { MongoUsersDAO } from './MongoUsersDAO.js';
import { MongoUserGroupsMapper } from './MongoUserGroupsMapper.js';
import type { UserGroupAggregateRow } from './MongoUserGroupsMapper.js';

type Deps = {
  dao: MongoUserGroupsDAO;
  usersDAO: MongoUsersDAO;
};

class MongoUserGroupsQueryService implements UserGroupsQueryService {
  private dao: MongoUserGroupsDAO;

  private usersDAO: MongoUsersDAO;

  constructor(deps: Deps) {
    this.dao = deps.dao;
    this.usersDAO = deps.usersDAO;
  }

  private membersPipeline(): Document[] {
    return [
      {
        $lookup: {
          from: 'users',
          let: { memberIds: '$members.refId' },
          pipeline: [
            {
              $match: {
                $and: [
                  { $expr: { $in: [{ $toString: '$_id' }, '$$memberIds'] } },
                  ...this.usersDAO.scopeFilters(),
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
  }

  async listUserGroups(): Promise<UserGroupWithMembers[]> {
    const rows = await this.dao.aggregate<UserGroupAggregateRow>(this.membersPipeline());

    return rows.map(row => MongoUserGroupsMapper.toWithMembers(row));
  }
}

export { MongoUserGroupsQueryService };
