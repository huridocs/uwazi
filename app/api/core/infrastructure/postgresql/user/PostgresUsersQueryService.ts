import type { UsersQueryService } from '#api/core/application/contracts/UsersQueryService.js';
import type { UserProfile } from '#api/core/application/contracts/UserReadModels.js';
import { PostgresUsersDAO } from './PostgresUsersDAO.js';
import { PostgresUsersMapper } from './PostgresUsersMapper.js';

type Deps = {
  usersDAO: PostgresUsersDAO;
};

/**
 * The Postgres half of UsersQueryService (D1/D3): the users settings screen read, and
 * nothing else. A pure projection — the join it used to do in JS now happens in SQL inside
 * PostgresUsersDAO.findWithGroups (D7), so this takes no user-groups DAO.
 *
 * `fields: ['status']` is required: with the DAO's default `identity` column list the rows
 * carry neither `using2fa` nor `accountLocked`, both of which UserProfile requires.
 */
class PostgresUsersQueryService implements UsersQueryService {
  private usersDAO: PostgresUsersDAO;

  constructor(deps: Deps) {
    this.usersDAO = deps.usersDAO;
  }

  async listUsers(): Promise<UserProfile[]> {
    const rows = await this.usersDAO.findWithGroups({}, { fields: ['status'] });

    return rows.map(row => PostgresUsersMapper.toProfile(row));
  }

  /* ------------------------------------------------------------------------------------
   * Legacy surface — removed in plan 05 step 1.
   *
   * These two reads belong to UsersDirectory (D3), but their call sites — search.js and
   * collaborators.ts — are out of plan 03's scope and move in plan 05. They stay here,
   * untyped by the contract, so the branch keeps compiling meanwhile; UsersQueryServiceFactory
   * widens its return type to expose them and narrows back to the bare interface when they go.
   *
   * Do not call these from new code. New readers use UsersDirectory.
   * ---------------------------------------------------------------------------------- */

  /** @deprecated use `UsersDirectory.list()`. Removed in plan 05. */
  async listBasicInfo(): Promise<{ _id: string; username: string }[]> {
    // The system-user and soft-delete guards are the DAO's default scope now (D5).
    const users = await this.usersDAO.findMany();

    return users.map(user => ({ _id: user._id, username: user.username }));
  }

  /** @deprecated use `UsersDirectory.searchByUsernameOrEmail()`. Removed in plan 05. */
  async findByEmailOrUsername(
    term: string
  ): Promise<{ _id: string; username: string; email: string }[]> {
    const users = await this.usersDAO.matchEmailOrUsername(term);

    return users.map(user => ({ _id: user._id, username: user.username, email: user.email }));
  }
}

export { PostgresUsersQueryService };
