import { UserGroup } from '#api/core/domain/userGroup/UserGroup.js';
import type { UserRole } from '#api/core/domain/user/User.js';
import type {
  UserGroupMemberView,
  UserGroupView,
} from '#api/core/application/contracts/UserGroupReadModels.js';
import type { UserGroupRow } from './PostgresUserGroupRow.js';
import type { UserRow } from './PostgresUserRow.js';

class PostgresUserGroupsMapper {
  static toDomain(row: UserGroupRow): UserGroup {
    return new UserGroup({ id: row._id, name: row.name, memberIds: row.members });
  }

  static toRow(id: string, name: string, memberIds: string[]): UserGroupRow {
    return { _id: id, name, members: memberIds };
  }

  static toView(row: Pick<UserGroupRow, '_id' | 'name'>): UserGroupView {
    return { _id: row._id, name: row.name };
  }

  static toMemberView(refId: string, user?: UserRow): UserGroupMemberView {
    if (!user) {
      return { refId };
    }

    return { refId, username: user.username, role: user.role as UserRole, email: user.email };
  }
}

export { PostgresUserGroupsMapper };
