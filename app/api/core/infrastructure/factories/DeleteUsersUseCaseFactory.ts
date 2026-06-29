import { DeleteUsers, DeleteUsersDependencies } from '#api/core/application/DeleteUsers.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UsergroupsDataSourceFactory } from './UsergroupsDataSourceFactory.js';
import { UsersDataSourceFactory } from './UsersDataSourceFactory.js';

export class DeleteUsersUseCaseFactory {
  static default(overrides?: Partial<DeleteUsersDependencies>) {
    const useCase = new DeleteUsers({
      usersDS: UsersDataSourceFactory.default(),
      usergroupsDS: UsergroupsDataSourceFactory.default(),
      transactionManager: ExecutionContext.transactionManager,
      ...overrides,
    });
    return useCase;
  }
}
