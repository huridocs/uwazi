import { ObjectId } from 'mongodb';
import escapeRegExp from 'lodash/escapeRegExp.js';
import type { UsersDirectory } from '#api/core/application/contracts/UsersDirectory.js';
import type { UserProfile, UserView } from '#api/core/application/contracts/UserReadModels.js';
import { PUBLIC_USER_ID } from '#api/core/domain/user/User.js';
import { UserNotFound } from '#api/core/domain/user/errors.js';
import { Result } from '#api/core/libs/Result.js';
import type { ResultType } from '#api/core/libs/Result.js';
import { MongoUsersDAO } from './MongoUsersDAO.js';
import { MongoUserGroupsDAO } from './MongoUserGroupsDAO.js';
import { MongoUsersMapper } from './MongoUsersMapper.js';
import type { UserScope } from './UserReadOptions.js';

type Deps = {
  usersDAO: MongoUsersDAO;
  userGroupsDAO: MongoUserGroupsDAO;
};

const isUserId = (id: string): boolean => /^[0-9a-fA-F]{24}$/.test(id);

class MongoUsersDirectory implements UsersDirectory {
  private usersDAO: MongoUsersDAO;

  private userGroupsDAO: MongoUserGroupsDAO;

  constructor(deps: Deps) {
    this.usersDAO = deps.usersDAO;
    this.userGroupsDAO = deps.userGroupsDAO;
  }

  async getById(id: string): Promise<ResultType<UserView, UserNotFound>> {
    if (!isUserId(id)) {
      return Result.fail(new UserNotFound(id));
    }

    const user = await this.usersDAO.findOne({ _id: ObjectId.createFromHexString(id) });

    if (!user) {
      return Result.fail(new UserNotFound(id));
    }

    return Result.ok(MongoUsersMapper.toView(user));
  }

  async getProfile(id: string): Promise<ResultType<UserProfile, UserNotFound>> {
    return this.profile(id);
  }

  async getActor(id: string): Promise<ResultType<UserProfile, UserNotFound>> {
    return this.profile(id, { deleted: 'include' });
  }

  async getPublicUser(): Promise<ResultType<UserProfile, UserNotFound>> {
    return this.profile(PUBLIC_USER_ID.toHexString(), { systemUser: 'include' });
  }

  private async profile(
    id: string,
    scope?: UserScope
  ): Promise<ResultType<UserProfile, UserNotFound>> {
    if (!isUserId(id)) {
      return Result.fail(new UserNotFound(id));
    }

    const user = await this.usersDAO.findOne(
      { _id: ObjectId.createFromHexString(id) },
      { fields: ['status'], scope }
    );

    if (!user) {
      return Result.fail(new UserNotFound(id));
    }

    const groups = await this.userGroupsDAO.getGroupsByUserIds([id]);

    return Result.ok(MongoUsersMapper.toProfile({ ...user, groups: groups.get(id) ?? [] }));
  }

  async getManyByIds(ids: string[]): Promise<UserView[]> {
    // Short-circuit without touching the database, matching the DAO's own behaviour.
    if (!ids.length) {
      return [];
    }

    // A malformed id cannot match anything, and throwing on one would make a single bad
    // permission refId take down the whole batch. Postgres simply does not match it.
    const objectIds = ids.filter(isUserId).map(id => ObjectId.createFromHexString(id));

    const users = await this.usersDAO.findMany({ _id: { $in: objectIds } });

    return users.map(user => MongoUsersMapper.toView(user));
  }

  async searchByUsernameOrEmail(term: string): Promise<UserView[]> {
    // Case-insensitive exact match. escapeRegExp matters: without it a term containing
    // regex metacharacters would match far more than it should — and Postgres, matching on
    // `lower(?)`, would disagree.
    const exactRegex = new RegExp(`^${escapeRegExp(term)}$`, 'i');

    const users = await this.usersDAO.findMany({
      $or: [{ username: exactRegex }, { email: exactRegex }],
    });

    return users.map(user => MongoUsersMapper.toView(user));
  }

  async list(): Promise<UserView[]> {
    const users = await this.usersDAO.findMany();

    return users.map(user => MongoUsersMapper.toView(user));
  }
}

export { MongoUsersDirectory };
