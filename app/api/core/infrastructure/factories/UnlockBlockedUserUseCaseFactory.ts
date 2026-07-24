import {
  UnlockBlockedUser,
  UnlockBlockedUserDependencies,
} from '#api/core/application/UnlockBlockedUser.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UsersDataSourceFactory } from './UsersDataSourceFactory.js';

export class UnlockBlockedUserUseCaseFactory {
  static default(overrides?: Partial<UnlockBlockedUserDependencies>) {
    const { actor, tenant } = ExecutionContext;
    const useCase = new UnlockBlockedUser(
      {
        usersDS: UsersDataSourceFactory.default(),
        ...overrides,
      },
      { actor, tenant }
    );
    return useCase;
  }
}
