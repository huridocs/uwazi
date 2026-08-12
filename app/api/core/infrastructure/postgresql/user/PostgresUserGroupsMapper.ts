import { UserGroup } from '#api/core/domain/userGroup/UserGroup.js';
import type { UserGroupRow } from './PostgresUserGroupRow.js';

class PostgresUserGroupsMapper {
  static toDomain(row: UserGroupRow): UserGroup {
    return new UserGroup({ id: row._id, name: row.name, memberIds: row.members });
  }

  static toRow(id: string, name: string, memberIds: string[]): UserGroupRow {
    return { _id: id, name, members: memberIds };
  }
}

export { PostgresUserGroupsMapper };
