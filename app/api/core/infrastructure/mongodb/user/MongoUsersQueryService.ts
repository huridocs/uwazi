import escapeRegExp from 'lodash/escapeRegExp.js';
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
    const users = await this.dao.findMany();

    return users.map(user => ({ _id: user._id.toString(), username: user.username }));
  }

  /** @deprecated use `UsersDirectory.searchByUsernameOrEmail()`. Removed in plan 05. */
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
