import {
  EmailInUse,
  UsernameExists,
  UserNotFound,
  InvalidUnlockCode,
} from '#api/core/domain/user/errors.js';
import { User } from '#api/core/domain/user/User.js';
import { UserAccount } from '#api/core/domain/user/UserAccount.js';
import { EncryptedPassword } from '#api/core/domain/user/EncryptedPassword.js';
import { ResultType } from '#api/core/libs/Result.js';

type TwoFactorStatus = { username: string; using2fa: boolean };

interface UsersDataSource {
  insert(user: UserAccount): Promise<void>;
  delete(userIds: string[]): Promise<number>;
  /**
   * Persists identity fields (username/role/email). When `user` is a UserAccount, also persists
   * the whole Credentials VO in the same write (password, lockout, 2FA state).
   */
  update(user: User): Promise<void>;
  getById(id: string): Promise<ResultType<User, UserNotFound>>;
  getByEmail(email: string): Promise<ResultType<User, UserNotFound>>;
  /**
   * Always hydrated with credentials (password hash + lockout/2FA state) — used by Login and
   * ValidateCurrentPassword, which need to check the current password.
   */
  getByUsername(username: string): Promise<ResultType<UserAccount, UserNotFound>>;
  /**
   * Same as getByUsername but keyed by id, for callers that must look up the existing record by
   * `_id` rather than by username (e.g. UpdateUser's password-reset path, where the submitted
   * username may itself be changing in the same request).
   */
  getAccountById(id: string): Promise<ResultType<UserAccount, UserNotFound>>;
  countActiveUsers(): Promise<number>;
  checkUniqueUsername(user: User): Promise<ResultType<boolean, UsernameExists>>;
  checkUniqueEmail(user: User): Promise<ResultType<boolean, EmailInUse>>;
  findByUsernameAndUnlockCode(
    username: string,
    code: string
  ): Promise<ResultType<User, InvalidUnlockCode>>;
  clearLockFields(userId: string): Promise<void>;
  updatePassword(userId: string, password: EncryptedPassword): Promise<void>;
  getTwoFactorStatus(userId: string): Promise<ResultType<TwoFactorStatus, UserNotFound>>;
  setTwoFactorSecret(userId: string, secret: string): Promise<void>;
  getTwoFactorSecret(userId: string): Promise<ResultType<string | null, UserNotFound>>;
  enableTwoFactor(userId: string): Promise<void>;
  disableTwoFactor(userId: string): Promise<void>;
}

export type { UsersDataSource, TwoFactorStatus };
