import type { ResultType } from '#api/core/libs/Result.js';
import type { UserNotFound } from '#api/core/domain/user/errors.js';
import type { UserView, UserProfile } from './UserReadModels.js';

interface UsersDirectory {
  getById(id: string): Promise<ResultType<UserView, UserNotFound>>;
  getProfile(id: string): Promise<ResultType<UserProfile, UserNotFound>>;
  getActor(id: string): Promise<ResultType<UserProfile, UserNotFound>>;
  getPublicUser(): Promise<ResultType<UserProfile, UserNotFound>>;
  getManyByIds(ids: string[]): Promise<UserView[]>;
  searchByUsernameOrEmail(term: string): Promise<UserView[]>;
  list(): Promise<UserView[]>;
}

export type { UsersDirectory };
