import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { UsergroupsDataSource } from '#api/core/application/contracts/UsergroupsDataSource.js';
import { MongoUsergroupsDataSource } from '../mongodb/user/MongoUsergroupsDataSource.js';

class UsergroupsDataSourceFactory {
  static default(): UsergroupsDataSource {
    return new MongoUsergroupsDataSource(getConnection(), ExecutionContext.transactionManager);
  }
}

export { UsergroupsDataSourceFactory };
