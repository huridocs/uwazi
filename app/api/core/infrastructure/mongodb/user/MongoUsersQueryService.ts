import type { UsersQueryService } from '#api/core/application/contracts/UsersQueryService.js';
import type { UserProfile } from '#api/core/application/contracts/UserReadModels.js';
import { MongoUsersDAO } from './MongoUsersDAO.js';
import { MongoUsersMapper } from './MongoUsersMapper.js';

type Deps = {
  dao: MongoUsersDAO;
};

/**
 * The Mongo half of UsersQueryService (D1/D3): the users settings screen read, and nothing
 * else. A pure projection — the `$lookup` it used to own lives on MongoUsersDAO (D7), so
 * this holds no query language and needs no db or transaction manager.
 *
 * `fields: ['status']` is required: with the DAO's default `identity` projection the rows
 * carry neither `using2fa` nor `accountLocked`, both of which UserProfile requires.
 */
class MongoUsersQueryService implements UsersQueryService {
  private dao: MongoUsersDAO;

  constructor(deps: Deps) {
    this.dao = deps.dao;
  }

  async listUsers(): Promise<UserProfile[]> {
    const users = await this.dao.findWithGroups({}, { fields: ['status'] });

    return users.map(user => MongoUsersMapper.toProfile(user));
  }
}

export { MongoUsersQueryService };
