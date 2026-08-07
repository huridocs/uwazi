import { Login } from '#api/core/application/Login.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { DispatcherAdapter } from '../jobs/DispatcherAdapter.js';
import { UsersDataSourceFactory } from './UsersDataSourceFactory.js';

export class LoginUseCaseFactory {
  static default() {
    return new Login(
      {
        usersDS: UsersDataSourceFactory.default(),
        dispatcher: new DispatcherAdapter(
          DefaultDispatcher(ExecutionContext.tenant.name, ExecutionContext.transactionManager)
        ),
      },
      { tenant: ExecutionContext.tenant }
    );
  }
}
