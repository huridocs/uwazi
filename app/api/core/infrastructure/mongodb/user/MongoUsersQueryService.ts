import { Filter } from 'mongodb';
import escapeRegExp from 'lodash/escapeRegExp.js';
import { UserDBO } from './UserDBO.js';
import { MongoUsersDAO } from './MongoUsersDAO.js';
import type { UserWithGroupsDBO } from './MongoUsersDAO.js';

type Deps = {
  dao: MongoUsersDAO;
};

/**
 * Interim shape — plan 03 retypes this against the UsersQueryService contract, drops the
 * filter parameter, and moves listBasicInfo / findByEmailOrUsername to UsersDirectory.
 *
 * No longer a MongoDataSource: the `$lookup` it used to own now lives on MongoUsersDAO
 * (D7), so this holds no query language and needs no db or transaction manager.
 */
class MongoUsersQueryService {
  private dao: MongoUsersDAO;

  constructor(deps: Deps) {
    this.dao = deps.dao;
  }

  async listWithGroups(query: Filter<UserDBO> = {}): Promise<UserWithGroupsDBO[]> {
    return this.dao.findWithGroups(query, { fields: ['status'] });
  }

  async listBasicInfo(): Promise<{ _id: string; username: string }[]> {
    // The system-user and soft-delete guards are the DAO's default scope now (D5).
    const users = await this.dao.findMany();

    return users.map(user => ({ _id: user._id.toString(), username: user.username }));
  }

  async findByEmailOrUsername(
    term: string
  ): Promise<{ _id: string; username: string; email: string }[]> {
    // Case-insensitive exact match. escapeRegExp matters: without it a term containing
    // regex metacharacters would match far more than it should.
    const exactRegex = new RegExp(`^${escapeRegExp(term)}$`, 'i');
    const users = await this.dao.findMany({
      $or: [{ username: exactRegex }, { email: exactRegex }],
    });

    return users.map(user => ({
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
    }));
  }
}

export { MongoUsersQueryService };
