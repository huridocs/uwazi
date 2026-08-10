import { GetUserGroupsUseCase } from '#api/core/application/GetUserGroups.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { UserGroupsDataSourceFactory } from './UserGroupsDataSourceFactory.js';

class GetUserGroupsUseCaseFactory {
  static default(overrides?: Partial<ConstructorParameters<typeof GetUserGroupsUseCase>[0]>) {
    return new GetUserGroupsUseCase({
      transactionManager: TransactionManagerFactory.default(),
      userGroupsDS: UserGroupsDataSourceFactory.default(),
      ...overrides,
    });
  }
}

export { GetUserGroupsUseCaseFactory };
