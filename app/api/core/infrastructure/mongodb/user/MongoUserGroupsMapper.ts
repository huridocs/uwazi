import type { UserRole } from '#api/core/domain/user/User.js';
import type {
  UserGroupMemberView,
  UserGroupView,
  UserGroupWithMembers,
} from '#api/core/application/contracts/UserGroupReadModels.js';
import type { UserGroupDBO } from './UserGroupDBO.js';

type UserGroupAggregateRow = {
  _id: string;
  name: string;
  members: { refId: string; username?: string; role?: UserRole; email?: string }[];
};

class MongoUserGroupsMapper {
  static toView(dbo: Pick<UserGroupDBO, '_id' | 'name'>): UserGroupView {
    return { _id: dbo._id.toString(), name: dbo.name };
  }

  static toWithMembers(row: UserGroupAggregateRow): UserGroupWithMembers {
    return {
      _id: row._id,
      name: row.name,
      members: row.members.map((member): UserGroupMemberView => {
        if (member.username === undefined) {
          return { refId: member.refId };
        }

        return {
          refId: member.refId,
          username: member.username,
          role: member.role,
          email: member.email,
        };
      }),
    };
  }
}

export { MongoUserGroupsMapper };
export type { UserGroupAggregateRow };
