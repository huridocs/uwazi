import { UpdateUserGroupUseCase } from '#api/core/application/UpdateUserGroup.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { UserGroupsDataSourceFactory } from './UserGroupsDataSourceFactory.js';

class UpdateUserGroupUseCaseFactory {
  static default(
    overrides?: Partial<ConstructorParameters<typeof UpdateUserGroupUseCase>[0]>
  ) {
    return new UpdateUserGroupUseCase({
      transactionManager: TransactionManagerFactory.default(),
      userGroupsDS: UserGroupsDataSourceFactory.default(),
      ...overrides,
    });
  }
}

export { UpdateUserGroupUseCaseFactory };
