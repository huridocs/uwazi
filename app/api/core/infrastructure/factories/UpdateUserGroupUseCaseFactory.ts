import { UpdateUserGroupUseCase } from '#api/core/application/UpdateUserGroup.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UserGroupsDataSourceFactory } from './UserGroupsDataSourceFactory.js';

class UpdateUserGroupUseCaseFactory {
  static default(overrides?: Partial<ConstructorParameters<typeof UpdateUserGroupUseCase>[0]>) {
    return new UpdateUserGroupUseCase({
      transactionManager: ExecutionContext.transactionManager,
      userGroupsDS: UserGroupsDataSourceFactory.default(),
      ...overrides,
    });
  }
}

export { UpdateUserGroupUseCaseFactory };
