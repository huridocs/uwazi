import { UserGroup } from '#api/core/domain/userGroup/UserGroup.js';
import { UserGroupNameExists } from '#api/core/domain/userGroup/errors.js';
import { ResultType } from '#api/core/libs/Result.js';

type CreateUserGroupParams = { name: string; memberIds: string[] };
type UpdateUserGroupParams = { id: string; name: string; memberIds: string[] };

interface UserGroupsDataSource {
  assignGroupsToUser(userId: string, groupIds: string[]): Promise<void>;
  getUserGroups(userId: string): Promise<{ _id: string; name: string }[]>;
  removeUsersFromGroups(userIds: string[]): Promise<void>;
  create(params: CreateUserGroupParams): Promise<UserGroup>;
  update(params: UpdateUserGroupParams): Promise<UserGroup>;
  delete(ids: string[]): Promise<void>;
  checkUniqueName(name: string, excludeId?: string): Promise<ResultType<true, UserGroupNameExists>>;
}

export type { UserGroupsDataSource, CreateUserGroupParams, UpdateUserGroupParams };
