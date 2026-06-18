import { User } from '#api/core/domain/user/User.js';

interface UsersDataSource {
  insert(user: User): Promise<void>;
  userExists(user: User): Promise<Boolean>;
  //update
}

export type { UsersDataSource };
