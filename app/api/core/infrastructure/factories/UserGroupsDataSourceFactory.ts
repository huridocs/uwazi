import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UserGroupsDataSource } from '#api/core/application/contracts/UserGroupsDataSource.js';
import { MongoUserGroupsDataSource } from '../mongodb/user/MongoUserGroupsDataSource.js';
import { PostgresUserGroupsDataSource } from '../postgresql/user/PostgresUserGroupsDataSource.js';
import { IdGeneratorFactory } from './IdGeneratorFactory.js';

class UserGroupsDataSourceFactory {
  static default(): UserGroupsDataSource {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresUsergroups) {
      return new PostgresUserGroupsDataSource({
        tenantId: tenant.name,
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
        idGenerator: IdGeneratorFactory.default(),
      });
    }

    return new MongoUserGroupsDataSource(
      getConnection(),
      ExecutionContext.transactionManager,
      IdGeneratorFactory.default()
    );
  }
}

export { UserGroupsDataSourceFactory };
