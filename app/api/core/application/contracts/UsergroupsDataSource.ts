import { User } from '#api/core/domain/user/User.js';

interface UsergroupsDataSource {
  updateUserGroups(user: User): Promise<void>;
  getUserGroups(user: User): Promise<User['groups']>;
}

export type { UsergroupsDataSource };
