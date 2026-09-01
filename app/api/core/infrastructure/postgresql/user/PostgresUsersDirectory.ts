import type { UsersDirectory } from '#api/core/application/contracts/UsersDirectory.js';
import type { UserProfile, UserView } from '#api/core/application/contracts/UserReadModels.js';
import type { UserGroupView } from '#api/core/application/contracts/UserGroupReadModels.js';
import { UserNotFound } from '#api/core/domain/user/errors.js';
import { Result } from '#api/core/libs/Result.js';
import type { ResultType } from '#api/core/libs/Result.js';
import { PostgresUsersDAO } from './PostgresUsersDAO.js';
import { PostgresUserGroupsDAO } from './PostgresUserGroupsDAO.js';
import { PostgresUsersMapper } from './PostgresUsersMapper.js';
import { PostgresUserGroupsMapper } from './PostgresUserGroupsMapper.js';
import { PUBLIC_USER_ID_STRING } from './UserReadOptions.js';
import type { UserScope } from './UserReadOptions.js';

type Deps = {
  usersDAO: PostgresUsersDAO;
  userGroupsDAO: PostgresUserGroupsDAO;
};

class PostgresUsersDirectory implements UsersDirectory {
  private usersDAO: PostgresUsersDAO;

  private userGroupsDAO: PostgresUserGroupsDAO;

  constructor(deps: Deps) {
    this.usersDAO = deps.usersDAO;
    this.userGroupsDAO = deps.userGroupsDAO;
  }

  async getById(id: string): Promise<ResultType<UserView, UserNotFound>> {
    const row = await this.usersDAO.findOne({ _id: id });

    if (!row) {
      return Result.fail(new UserNotFound(id));
    }

    return Result.ok(PostgresUsersMapper.toView(row));
  }

  async getProfile(id: string): Promise<ResultType<UserProfile, UserNotFound>> {
    return this.profile(id);
  }

  async getActor(id: string): Promise<ResultType<UserProfile, UserNotFound>> {
    return this.profile(id, { deleted: 'include' });
  }

  async getPublicUser(): Promise<ResultType<UserProfile, UserNotFound>> {
    return this.profile(PUBLIC_USER_ID_STRING, { systemUser: 'include' });
  }

  private async profile(
    id: string,
    scope?: UserScope
  ): Promise<ResultType<UserProfile, UserNotFound>> {
    const row = await this.usersDAO.findOne({ _id: id }, { fields: ['status'], scope });

    if (!row) {
      return Result.fail(new UserNotFound(id));
    }

    const groups = await this.groupsOf([id]);

    return Result.ok(PostgresUsersMapper.toProfile({ ...row, groups: groups.get(id) ?? [] }));
  }

  private async groupsOf(userIds: string[]): Promise<Map<string, UserGroupView[]>> {
    const map = new Map<string, UserGroupView[]>(userIds.map(id => [id, []]));
    if (!userIds.length) return map;

    const groups = await this.userGroupsDAO.table.whereJsonSupersetOfAny('members', userIds).all();

    groups.forEach(group => {
      group.members.forEach(memberId => {
        map.get(memberId)?.push(PostgresUserGroupsMapper.toView(group));
      });
    });

    return map;
  }

  async getManyByIds(ids: string[]): Promise<UserView[]> {
    const rows = await this.usersDAO.findManyByIds(ids);

    return rows.map(row => PostgresUsersMapper.toView(row));
  }

  async searchByUsernameOrEmail(term: string): Promise<UserView[]> {
    const rows = await this.usersDAO.matchEmailOrUsername(term);

    return rows.map(row => PostgresUsersMapper.toView(row));
  }

  async list(): Promise<UserView[]> {
    const rows = await this.usersDAO.findMany();

    return rows.map(row => PostgresUsersMapper.toView(row));
  }
}

export { PostgresUsersDirectory };
