import { Login } from '#api/core/application/Login.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UsersDataSourceFactory } from './UsersDataSourceFactory.js';
import { DispatcherFactory } from '#api/core/infrastructure/factories/DispatcherFactory.js';

export class LoginUseCaseFactory {
  static default() {
    return new Login(
      {
        usersDS: UsersDataSourceFactory.default(),
        dispatcher: DispatcherFactory.default(),
      },
      { tenant: ExecutionContext.tenant }
    );
  }
}
