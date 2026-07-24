import { ResetPassword, ResetPasswordDependencies } from '#api/core/application/ResetPassword.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UsersDataSourceFactory } from './UsersDataSourceFactory.js';
import { PasswordRecoveriesDataSourceFactory } from './PasswordRecoveriesDataSourceFactory.js';

export class ResetPasswordUseCaseFactory {
  static default(overrides?: Partial<ResetPasswordDependencies>) {
    const useCase = new ResetPassword(
      {
        usersDS: UsersDataSourceFactory.default(),
        passwordRecoveriesDS: PasswordRecoveriesDataSourceFactory.default(),
        transactionManager: ExecutionContext.transactionManager,
        ...overrides,
      },
      { tenant: ExecutionContext.tenant }
    );
    return useCase;
  }
}
