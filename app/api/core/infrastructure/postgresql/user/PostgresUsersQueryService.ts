import type { UsersQueryService } from '#api/core/application/contracts/UsersQueryService.js';
import type { RoleCounts, UserProfile } from '#api/core/application/contracts/UserReadModels.js';
import { zeroFilledByRole } from '#api/core/application/contracts/UserReadModels.js';
import { PostgresUsersDAO } from './PostgresUsersDAO.js';
import { PostgresUsersMapper } from './PostgresUsersMapper.js';

type Deps = {
  usersDAO: PostgresUsersDAO;
};

class PostgresUsersQueryService implements UsersQueryService {
  private usersDAO: PostgresUsersDAO;

  constructor(deps: Deps) {
    this.usersDAO = deps.usersDAO;
  }

  async listUsers(): Promise<UserProfile[]> {
    const rows = await this.usersDAO.findWithGroups({}, { fields: ['status'] });

    return rows.map(row => PostgresUsersMapper.toProfile(row));
  }

  async countByRole(): Promise<RoleCounts> {
    return zeroFilledByRole(await this.usersDAO.countByRole());
  }
}

export { PostgresUsersQueryService };
