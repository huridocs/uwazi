import {
  EnableTwoFactorAuth,
  EnableTwoFactorAuthDependencies,
} from '#api/core/application/EnableTwoFactorAuth.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UsersDataSourceFactory } from './UsersDataSourceFactory.js';

export class EnableTwoFactorAuthUseCaseFactory {
  static default(overrides?: Partial<EnableTwoFactorAuthDependencies>) {
    const { actor, tenant } = ExecutionContext;
    return new EnableTwoFactorAuth(
      {
        usersDS: UsersDataSourceFactory.default(),
        ...overrides,
      },
      { actor, tenant }
    );
  }
}
