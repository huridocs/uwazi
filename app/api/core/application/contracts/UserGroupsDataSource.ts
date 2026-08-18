import { UserGroup } from '#api/core/domain/userGroup/UserGroup.js';
import { UserGroupNameExists, UserGroupNotFound } from '#api/core/domain/userGroup/errors.js';
import { ResultType } from '#api/core/libs/Result.js';

interface UserGroupsDataSource {
  assignGroupsToUser(userId: string, groupIds: string[]): Promise<void>;
  getUserGroups(userId: string): Promise<{ _id: string; name: string }[]>;
  removeUsersFromGroups(userIds: string[]): Promise<void>;
  findById(id: string): Promise<ResultType<UserGroup, UserGroupNotFound>>;
  create(userGroup: UserGroup): Promise<UserGroup>;
  update(userGroup: UserGroup): Promise<UserGroup>;
  delete(ids: string[]): Promise<void>;
  checkUniqueName(name: string, excludeId?: string): Promise<ResultType<true, UserGroupNameExists>>;
}

export type { UserGroupsDataSource };
