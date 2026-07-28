import {
  EmailInUse,
  UsernameExists,
  UserNotFound,
  InvalidUnlockCode,
} from '#api/core/domain/user/errors.js';
import { User } from '#api/core/domain/user/User.js';
import { EncryptedPassword } from '#api/core/domain/user/EncryptedPassword.js';
import { ResultType } from '#api/core/libs/Result.js';

interface UsersDataSource {
  insert(user: User): Promise<void>;
  delete(userIds: string[]): Promise<number>;
  update(user: User): Promise<void>;
  getById(id: string): Promise<ResultType<User, UserNotFound>>;
  getByEmail(email: string): Promise<ResultType<User, UserNotFound>>;
  countActiveUsers(): Promise<number>;
  checkUniqueUsername(user: User): Promise<ResultType<boolean, UsernameExists>>;
  checkUniqueEmail(user: User): Promise<ResultType<boolean, EmailInUse>>;
  findByUsernameAndUnlockCode(
    username: string,
    code: string
  ): Promise<ResultType<User, InvalidUnlockCode>>;
  clearLockFields(userId: string): Promise<void>;
  updatePassword(userId: string, password: EncryptedPassword): Promise<void>;
}

export type { UsersDataSource };
