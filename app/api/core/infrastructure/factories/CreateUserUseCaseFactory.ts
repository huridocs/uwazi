import { CreateUser, CreateUserDependencies } from '#api/core/application/CreateUser.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { IdGeneratorFactory } from './IdGeneratorFactory.js';
import { UserGroupsDataSourceFactory } from './UserGroupsDataSourceFactory.js';
import { UsersDataSourceFactory } from './UsersDataSourceFactory.js';
import { DispatcherFactory } from '#api/core/infrastructure/factories/DispatcherFactory.js';

export class CreateUserUseCaseFactory {
  static default(overrides?: Partial<CreateUserDependencies>) {
    const useCase = new CreateUser({
      usersDS: UsersDataSourceFactory.default(),
      usergroupsDS: UserGroupsDataSourceFactory.default(),
      idGenerator: IdGeneratorFactory.default(),
      transactionManager: ExecutionContext.transactionManager,
      dispatcher: DispatcherFactory.default(),
      ...overrides,
    });
    return useCase;
  }
}
