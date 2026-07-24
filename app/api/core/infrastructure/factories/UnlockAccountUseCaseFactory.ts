import { UnlockAccount, UnlockAccountDependencies } from '#api/core/application/UnlockAccount.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UsersDataSourceFactory } from './UsersDataSourceFactory.js';

export class UnlockAccountUseCaseFactory {
  static default(overrides?: Partial<UnlockAccountDependencies>) {
    const useCase = new UnlockAccount(
      {
        usersDS: UsersDataSourceFactory.default(),
        ...overrides,
      },
      { tenant: ExecutionContext.tenant }
    );
    return useCase;
  }
}
