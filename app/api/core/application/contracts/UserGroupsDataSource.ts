import { User } from '#api/core/domain/user/User.js';

interface UserGroupsDataSource {
  updateUserGroups(user: User): Promise<void>;
  getUserGroups(user: User): Promise<User['groups']>;
  removeUsersFromGroups(userIds: string[]): Promise<void>;
}

export type { UserGroupsDataSource };
