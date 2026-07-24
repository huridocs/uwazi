import { PasswordRecoveriesDataSource } from '#api/core/application/contracts/PasswordRecoveriesDataSource.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoPasswordRecoveriesDataSource } from '../mongodb/user/MongoPasswordRecoveriesDataSource.js';

class PasswordRecoveriesDataSourceFactory {
  static default(): PasswordRecoveriesDataSource {
    return new MongoPasswordRecoveriesDataSource({
      db: getConnection(),
      transactionManager: ExecutionContext.transactionManager,
    });
  }
}

export { PasswordRecoveriesDataSourceFactory };
