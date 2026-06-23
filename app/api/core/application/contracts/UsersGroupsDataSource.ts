import { User } from '#api/core/domain/user/User.js';

interface UsersGroupsDataSource {
  updateUserGroups(user: User): Promise<void>;
  getUserGroups(user: User): Promise<User['groups']>;
}

export type { UsersGroupsDataSource };
