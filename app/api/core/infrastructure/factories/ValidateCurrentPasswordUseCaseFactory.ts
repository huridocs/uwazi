import { ValidateCurrentPassword } from '#api/core/application/ValidateCurrentPassword.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UsersDataSourceFactory } from './UsersDataSourceFactory.js';

export class ValidateCurrentPasswordUseCaseFactory {
  static default() {
    return new ValidateCurrentPassword(
      { usersDS: UsersDataSourceFactory.default() },
      { tenant: ExecutionContext.tenant }
    );
  }
}
