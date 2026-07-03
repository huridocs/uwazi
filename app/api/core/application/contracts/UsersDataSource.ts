import { EmailInUse, UsernameExists } from '#api/core/domain/user/errors.js';
import { User } from '#api/core/domain/user/User.js';
import { ResultType } from '#api/core/libs/Result.js';

interface UsersDataSource {
  insert(user: User): Promise<void>;
  delete(userIds: string[]): Promise<number>;
  countActiveUsers(): Promise<number>;
  checkUniqueUsername(user: User): Promise<ResultType<boolean, UsernameExists>>;
  checkUniqueEmail(user: User): Promise<ResultType<boolean, EmailInUse>>;
}

export type { UsersDataSource };
