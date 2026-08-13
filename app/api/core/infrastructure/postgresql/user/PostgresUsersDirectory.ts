import type { UsersDirectory } from '#api/core/application/contracts/UsersDirectory.js';
import type { UserProfile, UserView } from '#api/core/application/contracts/UserReadModels.js';
import { UserNotFound } from '#api/core/domain/user/errors.js';
import { Result } from '#api/core/libs/Result.js';
import type { ResultType } from '#api/core/libs/Result.js';
import { PostgresUsersDAO } from './PostgresUsersDAO.js';
import { PostgresUserGroupsDAO } from './PostgresUserGroupsDAO.js';
import { PostgresUsersMapper } from './PostgresUsersMapper.js';
import type { UserScope } from './UserReadOptions.js';

type Deps = {
  usersDAO: PostgresUsersDAO;
  userGroupsDAO: PostgresUserGroupsDAO;
};

/**
 * The Postgres half of UsersDirectory (D1/D3).
 *
 * It holds no SQL and no guard logic — guards are the DAO's, uniformly, via its default
 * scope (D5/D7). The case-insensitive match is a DAO method here (`lower(x) = lower(?)`
 * across two columns is not expressible in the equality-only condition object) where Mongo
 * builds a `Filter` in the adapter; D4 permits that asymmetry.
 */
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
    // The only non-default scope in this class: actors are resolved even once soft-deleted,
    // so historical records can still name who did the thing (D3/D9).
    return this.profile(id, { deleted: 'include' });
  }

  private async profile(
    id: string,
    scope?: UserScope
  ): Promise<ResultType<UserProfile, UserNotFound>> {
    const row = await this.usersDAO.findOne({ _id: id }, { fields: ['status'], scope });

    if (!row) {
      return Result.fail(new UserNotFound(id));
    }

    // A single-user lookup, so `getGroupsByUserIds` rather than `findWithGroups`: the latter
    // unnests every group in the tenant to build its hash join, which pays off for a list
    // and not for one row.
    const groups = await this.userGroupsDAO.getGroupsByUserIds([id]);

    return Result.ok(PostgresUsersMapper.toProfile({ ...row, groups: groups.get(id) ?? [] }));
  }

  async getManyByIds(ids: string[]): Promise<UserView[]> {
    // findManyByIds short-circuits on an empty list without touching the database.
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
