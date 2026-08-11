import type { EnrichedGroupMember, EnrichedUserGroup } from '#shared/contracts/UserGroups.js';
import { PostgresDataSource, PostgresDataSourceDeps } from '../common/PostgresDataSource.js';
import { PostgresUsersDAO } from './PostgresUsersDAO.js';
import type { UserGroupRow } from './PostgresUserGroupRow.js';
import type { UserRow } from './PostgresUserRow.js';

type Deps = PostgresDataSourceDeps & { usersDAO: PostgresUsersDAO };

class PostgresUserGroupsDAO extends PostgresDataSource<UserGroupRow> {
  private usersDAO: PostgresUsersDAO;

  constructor(deps: Deps) {
    super('usergroups', deps);
    this.usersDAO = deps.usersDAO;
  }

  async getGroupsByUserIds(
    userIds: string[]
  ): Promise<Map<string, { _id: string; name: string }[]>> {
    const map = new Map<string, { _id: string; name: string }[]>(userIds.map(id => [id, []]));
    if (!userIds.length) return map;

    const groups = await this.table.all();
    groups.forEach(group => {
      group.members.forEach(memberId => {
        map.get(memberId)?.push({ _id: group._id, name: group.name });
      });
    });

    return map;
  }

  async getAll(): Promise<EnrichedUserGroup[]> {
    const groups = await this.table.all();
    const memberIds = [...new Set(groups.flatMap(group => group.members))];
    const users = await this.usersDAO.findByIds(memberIds);
    const usersById = new Map<string, UserRow>(users.map(user => [user._id, user]));

    return groups.map(group => ({
      _id: group._id,
      name: group.name,
      members: group.members.map((refId): EnrichedGroupMember => {
        const user = usersById.get(refId);
        return user
          ? { refId, username: user.username, role: user.role, email: user.email }
          : { refId };
      }),
    }));
  }
}

export { PostgresUserGroupsDAO };
