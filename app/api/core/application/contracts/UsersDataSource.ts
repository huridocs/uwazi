import {
  EmailInUse,
  IsDeletingSelf,
  IsPublicUser,
  UsernameExists,
} from '#api/core/domain/user/errors.js';
import { User } from '#api/core/domain/user/User.js';
import { ResultType } from '#api/core/libs/Result.js';

interface UsersDataSource {
  insert(user: User): Promise<void>;
  delete(userIds: string[]): Promise<number>;
  checkUniqueUsername(user: User): Promise<ResultType<boolean, UsernameExists>>;
  checkUniqueEmail(user: User): Promise<ResultType<boolean, EmailInUse>>;
  checkIsPublicUser(userIds: string[]): ResultType<boolean, IsPublicUser>;
  checkIsDeletingSelf(userIds: string[], selfId: string): ResultType<boolean, IsDeletingSelf>;
}

export type { UsersDataSource };
