import { User } from '#api/core/domain/user/User.js';

interface UsersDataSource {
  insert(user: User): Promise<void>;
  checkUniqueUsername(user: User): Promise<Boolean>;
  checkUniqueEmail(user: User): Promise<Boolean>;
}

export type { UsersDataSource };
