import { UpdateUser, UpdateUserDependencies } from '#api/core/application/UpdateUser.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UsergroupsDataSourceFactory } from './UsergroupsDataSourceFactory.js';
import { UsersDataSourceFactory } from './UsersDataSourceFactory.js';

export class UpdateUserUseCaseFactory {
  static default(overrides?: Partial<UpdateUserDependencies>) {
    const useCase = new UpdateUser({
      usersDS: UsersDataSourceFactory.default(),
      usergroupsDS: UsergroupsDataSourceFactory.default(),
      transactionManager: ExecutionContext.transactionManager,
      ...overrides,
    });
    return useCase;
  }
}
