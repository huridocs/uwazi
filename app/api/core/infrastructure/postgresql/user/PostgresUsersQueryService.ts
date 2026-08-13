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
}

export { PostgresUsersQueryService };
