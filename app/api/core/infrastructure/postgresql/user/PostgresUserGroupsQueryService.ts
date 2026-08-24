import type { UserGroupsQueryService } from '#api/core/application/contracts/UserGroupsQueryService.js';
import type { UserGroupWithMembers } from '#api/core/application/contracts/UserGroupReadModels.js';
import { PostgresUserGroupsDAO } from './PostgresUserGroupsDAO.js';
import { PostgresUsersDAO } from './PostgresUsersDAO.js';
import { PostgresUserGroupsMapper } from './PostgresUserGroupsMapper.js';
import type { UserRow } from './PostgresUserRow.js';

type Deps = {
  dao: PostgresUserGroupsDAO;
  usersDAO: PostgresUsersDAO;
};

class PostgresUserGroupsQueryService implements UserGroupsQueryService {
  private dao: PostgresUserGroupsDAO;

  private usersDAO: PostgresUsersDAO;

  constructor(deps: Deps) {
    this.dao = deps.dao;
    this.usersDAO = deps.usersDAO;
  }

  async listUserGroups(): Promise<UserGroupWithMembers[]> {
    const groups = await this.dao.table.all();
    const memberIds = [...new Set(groups.flatMap(group => group.members))];
    const users = await this.usersDAO.findManyByIds(memberIds);
    const usersById = new Map<string, UserRow>(users.map(user => [user._id, user]));

    return groups.map(group => ({
      ...PostgresUserGroupsMapper.toView(group),
      members: group.members.map(refId =>
        PostgresUserGroupsMapper.toMemberView(refId, usersById.get(refId))
      ),
    }));
  }
}

export { PostgresUserGroupsQueryService };
