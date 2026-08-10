import { CreateUserGroupUseCase } from '#api/core/application/CreateUserGroup.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UserGroupsDataSourceFactory } from './UserGroupsDataSourceFactory.js';

class CreateUserGroupUseCaseFactory {
  static default(overrides?: Partial<ConstructorParameters<typeof CreateUserGroupUseCase>[0]>) {
    return new CreateUserGroupUseCase({
      transactionManager: ExecutionContext.transactionManager,
      userGroupsDS: UserGroupsDataSourceFactory.default(),
      idGenerator: IdGeneratorFactory.default(),
      ...overrides,
    });
  }
}

export { CreateUserGroupUseCaseFactory };
