import { PostgresUsersDAO } from './PostgresUsersDAO.js';
import type { Condition, UserWithGroupsRow } from './PostgresUsersDAO.js';

type Deps = {
  usersDAO: PostgresUsersDAO;
};

/**
 * Interim shape — plan 03 retypes this against the UsersQueryService contract, drops the
 * filter parameter, and moves listBasicInfo / findByEmailOrUsername to UsersDirectory.
 *
 * No longer takes a user-groups DAO: the join it used to do in JS now happens in SQL inside
 * PostgresUsersDAO.findWithGroups (D7).
 */
class PostgresUsersQueryService {
  private usersDAO: PostgresUsersDAO;

  constructor(deps: Deps) {
    this.usersDAO = deps.usersDAO;
  }

  async listWithGroups(query: Condition = {}): Promise<UserWithGroupsRow[]> {
    return this.usersDAO.findWithGroups(query, { fields: ['status'] });
  }

  async listBasicInfo(): Promise<{ _id: string; username: string }[]> {
    // The system-user and soft-delete guards are the DAO's default scope now (D5).
    const users = await this.usersDAO.findMany();

    return users.map(user => ({ _id: user._id, username: user.username }));
  }

  async findByEmailOrUsername(
    term: string
  ): Promise<{ _id: string; username: string; email: string }[]> {
    const users = await this.usersDAO.matchEmailOrUsername(term);

    return users.map(user => ({ _id: user._id, username: user.username, email: user.email }));
  }
}

export { PostgresUsersQueryService };
