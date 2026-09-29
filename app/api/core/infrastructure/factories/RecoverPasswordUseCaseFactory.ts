import { RecoverPassword } from '#api/core/application/RecoverPassword.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UsersDataSourceFactory } from './UsersDataSourceFactory.js';
import { PasswordRecoveriesDataSourceFactory } from './PasswordRecoveriesDataSourceFactory.js';
import { DispatcherFactory } from '#api/core/infrastructure/factories/DispatcherFactory.js';

export class RecoverPasswordUseCaseFactory {
  static default() {
    const useCase = new RecoverPassword(
      {
        usersDS: UsersDataSourceFactory.default(),
        passwordRecoveriesDS: PasswordRecoveriesDataSourceFactory.default(),
        transactionManager: ExecutionContext.transactionManager,
        dispatcher: DispatcherFactory.default(),
      },
      { tenant: ExecutionContext.tenant }
    );
    return useCase;
  }
}
