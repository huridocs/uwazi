import { User } from '#api/core/domain/user/User.js';
import { UserGroup } from '#api/core/domain/userGroup/UserGroup.js';
import { UserGroupNameExists } from '#api/core/domain/userGroup/errors.js';
import { ResultType } from '#api/core/libs/Result.js';

type UserGroupMember = { refId: string; username?: string; role?: string; email?: string };
type UserGroupWithMembers = { _id: string; name: string; members: UserGroupMember[] };

type CreateUserGroupParams = { name: string; memberIds: string[] };
type UpdateUserGroupParams = { id: string; name: string; memberIds: string[] };

interface UserGroupsDataSource {
  updateUserGroups(user: User): Promise<void>;
  getUserGroups(user: User): Promise<User['groups']>;
  removeUsersFromGroups(userIds: string[]): Promise<void>;
  create(params: CreateUserGroupParams): Promise<UserGroup>;
  update(params: UpdateUserGroupParams): Promise<UserGroup>;
  delete(ids: string[]): Promise<void>;
  checkUniqueName(name: string, excludeId?: string): Promise<ResultType<true, UserGroupNameExists>>;
  getAll(): Promise<UserGroupWithMembers[]>;
}

export type {
  UserGroupsDataSource,
  UserGroupMember,
  UserGroupWithMembers,
  CreateUserGroupParams,
  UpdateUserGroupParams,
};
