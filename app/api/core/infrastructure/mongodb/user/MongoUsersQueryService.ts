import type { UsersQueryService } from '#api/core/application/contracts/UsersQueryService.js';
import type {
  RoleCounts,
  UserProfile,
  UserView,
} from '#api/core/application/contracts/UserReadModels.js';
import { zeroFilledByRole } from '#api/core/application/contracts/UserReadModels.js';
import { MongoUsersDAO } from './MongoUsersDAO.js';
import { MongoUsersMapper } from './MongoUsersMapper.js';

type Deps = {
  dao: MongoUsersDAO;
};

class MongoUsersQueryService implements UsersQueryService {
  private dao: MongoUsersDAO;

  constructor(deps: Deps) {
    this.dao = deps.dao;
  }

  async listUsers(): Promise<UserProfile[]> {
    const users = await this.dao.findWithGroups({}, { fields: ['status'] });

    return users.map(user => MongoUsersMapper.toProfile(user));
  }

  async countByRole(): Promise<RoleCounts> {
    return zeroFilledByRole(await this.dao.countByRole());
  }

  async findByUsername(username: string): Promise<UserView | undefined> {
    const user = await this.dao.findOne({ username });

    return user ? MongoUsersMapper.toView(user) : undefined;
  }
}

export { MongoUsersQueryService };
