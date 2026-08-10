import { CreateUserGroupUseCase } from '#api/core/application/CreateUserGroup.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { UserGroupsDataSourceFactory } from './UserGroupsDataSourceFactory.js';

class CreateUserGroupUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof CreateUserGroupUseCase>[0]>
  ) {
    return new CreateUserGroupUseCase({
      transactionManager: TransactionManagerFactory.default(),
      userGroupsDS: UserGroupsDataSourceFactory.default(),
      idGenerator: IdGeneratorFactory.default(),
      ...overrides,
    });
  }
}

export { CreateUserGroupUseCaseFactory };
