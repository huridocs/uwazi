import { DeleteUserGroupsUseCase } from '#api/core/application/DeleteUserGroups.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UserGroupsDataSourceFactory } from './UserGroupsDataSourceFactory.js';

class DeleteUserGroupsUseCaseFactory {
  static default(overrides?: Partial<ConstructorParameters<typeof DeleteUserGroupsUseCase>[0]>) {
    return new DeleteUserGroupsUseCase({
      transactionManager: ExecutionContext.transactionManager,
      userGroupsDS: UserGroupsDataSourceFactory.default(),
      ...overrides,
    });
  }
}

export { DeleteUserGroupsUseCaseFactory };
