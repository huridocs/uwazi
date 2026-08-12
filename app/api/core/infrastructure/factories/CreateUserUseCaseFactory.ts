import { CreateUser, CreateUserDependencies } from '#api/core/application/CreateUser.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UwaziDispatcherFactory } from '#api/core/infrastructure/jobs/UwaziDispatcherFactory.js';
import { DispatcherAdapter } from '../jobs/DispatcherAdapter.js';
import { IdGeneratorFactory } from './IdGeneratorFactory.js';
import { UsergroupsDataSourceFactory } from './UsergroupsDataSourceFactory.js';
import { UsersDataSourceFactory } from './UsersDataSourceFactory.js';

export class CreateUserUseCaseFactory {
  static default(overrides?: Partial<CreateUserDependencies>) {
    const useCase = new CreateUser({
      usersDS: UsersDataSourceFactory.default(),
      usergroupsDS: UsergroupsDataSourceFactory.default(),
      idGenerator: IdGeneratorFactory.default(),
      transactionManager: ExecutionContext.transactionManager,
      dispatcher: new DispatcherAdapter(
        UwaziDispatcherFactory(ExecutionContext.tenant.name, ExecutionContext.transactionManager)
      ),
      ...overrides,
    });
    return useCase;
  }
}
