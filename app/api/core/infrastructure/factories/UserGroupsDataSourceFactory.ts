import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UserGroupsDataSource } from '#api/core/application/contracts/UserGroupsDataSource.js';
import { MongoUserGroupsDataSource } from '../mongodb/user/MongoUserGroupsDataSource.js';
import { IdGeneratorFactory } from './IdGeneratorFactory.js';

class UserGroupsDataSourceFactory {
  static default(): UserGroupsDataSource {
    return new MongoUserGroupsDataSource(
      getConnection(),
      ExecutionContext.transactionManager,
      IdGeneratorFactory.default()
    );
  }
}

export { UserGroupsDataSourceFactory };
