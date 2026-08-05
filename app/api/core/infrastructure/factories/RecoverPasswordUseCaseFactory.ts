import { RecoverPassword } from '#api/core/application/RecoverPassword.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { DispatcherAdapter } from '../jobs/DispatcherAdapter.js';
import { UsersDataSourceFactory } from './UsersDataSourceFactory.js';
import { PasswordRecoveriesDataSourceFactory } from './PasswordRecoveriesDataSourceFactory.js';

export class RecoverPasswordUseCaseFactory {
  static default() {
    const useCase = new RecoverPassword(
      {
        usersDS: UsersDataSourceFactory.default(),
        passwordRecoveriesDS: PasswordRecoveriesDataSourceFactory.default(),
        transactionManager: ExecutionContext.transactionManager,
        dispatcher: new DispatcherAdapter(
          DefaultDispatcher(ExecutionContext.tenant.name, ExecutionContext.transactionManager)
        ),
      },
      { tenant: ExecutionContext.tenant }
    );
    return useCase;
  }
}
