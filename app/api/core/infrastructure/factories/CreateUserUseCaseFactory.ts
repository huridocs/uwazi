import { CreateUser, Dependencies } from '#api/core/application/CreateUser.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { DispatcherAdapter } from '../jobs/DispatcherAdapter.js';
import { IdGeneratorFactory } from './IdGeneratorFactory.js';
import { UsergroupsDataSourceFactory } from './UsergroupsDataSourceFactory.js';
import { UsersDataSourceFactory } from './UsersDataSourceFactory.js';

export class CreateUserUseCaseFactory {
  static default(overrides?: Partial<Dependencies>) {
    const useCase = new CreateUser({
      usersDS: UsersDataSourceFactory.default(),
      usergroupsDS: UsergroupsDataSourceFactory.default(),
      idGenerator: IdGeneratorFactory.default(),
      transactionManager: ExecutionContext.transactionManager,
      dispatcher: new DispatcherAdapter(
        DefaultDispatcher(ExecutionContext.tenant.name, ExecutionContext.transactionManager)
      ),
      ...overrides,
    });
    return useCase;
  }
}
