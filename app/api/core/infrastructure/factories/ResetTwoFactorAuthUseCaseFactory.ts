import {
  ResetTwoFactorAuth,
  ResetTwoFactorAuthDependencies,
} from '#api/core/application/ResetTwoFactorAuth.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UsersDataSourceFactory } from './UsersDataSourceFactory.js';

export class ResetTwoFactorAuthUseCaseFactory {
  static default(overrides?: Partial<ResetTwoFactorAuthDependencies>) {
    const { actor, tenant } = ExecutionContext;
    return new ResetTwoFactorAuth(
      {
        usersDS: UsersDataSourceFactory.default(),
        ...overrides,
      },
      { actor, tenant }
    );
  }
}
