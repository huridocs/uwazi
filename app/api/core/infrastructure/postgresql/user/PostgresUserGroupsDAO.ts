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
