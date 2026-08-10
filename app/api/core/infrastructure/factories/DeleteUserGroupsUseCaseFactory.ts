import { DeleteUserGroupsUseCase } from '#api/core/application/DeleteUserGroups.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { UserGroupsDataSourceFactory } from './UserGroupsDataSourceFactory.js';

class DeleteUserGroupsUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof DeleteUserGroupsUseCase>[0]>
  ) {
    return new DeleteUserGroupsUseCase({
      transactionManager: TransactionManagerFactory.default(),
      userGroupsDS: UserGroupsDataSourceFactory.default(),
      ...overrides,
    });
  }
}

export { DeleteUserGroupsUseCaseFactory };
