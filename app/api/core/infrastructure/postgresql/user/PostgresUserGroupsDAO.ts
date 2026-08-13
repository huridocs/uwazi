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
    // Pre-seeded so every requested id has an entry — callers rely on `map.get(id) ?? []`
    // never distinguishing "no groups" from "not asked for".
    const map = new Map<string, { _id: string; name: string }[]>(userIds.map(id => [id, []]));
    if (!userIds.length) return map;

    // Filtered in SQL, served by the usergroups_members_gin index (migration 015). This
    // previously called `this.table.all()`, loading every group in the tenant to join in JS.
    const groups = await this.table.whereJsonSupersetOfAny('members', userIds).all();
    groups.forEach(group => {
      group.members.forEach(memberId => {
        map.get(memberId)?.push({ _id: group._id, name: group.name });
      });
    });

    return map;
  }

  async getAll(): Promise<EnrichedUserGroup[]> {
    // `all()` is the intent here — this returns every group in the tenant — so unlike
    // getGroupsByUserIds there is no filter to push down. The member lookup goes through
    // findManyByIds rather than the deprecated findByIds shim, so plan 05 can delete the
    // shim without touching this.
    const groups = await this.table.all();
    const memberIds = [...new Set(groups.flatMap(group => group.members))];
    const users = await this.usersDAO.findManyByIds(memberIds);
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
