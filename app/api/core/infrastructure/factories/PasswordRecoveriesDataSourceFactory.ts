import { PasswordRecoveriesDataSource } from '#api/core/application/contracts/PasswordRecoveriesDataSource.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { MongoPasswordRecoveriesDataSource } from '../mongodb/user/MongoPasswordRecoveriesDataSource.js';
import { PostgresPasswordRecoveriesDataSource } from '../postgresql/passwordRecovery/PostgresPasswordRecoveriesDataSource.js';
import { IdGeneratorFactory } from './IdGeneratorFactory.js';

class PasswordRecoveriesDataSourceFactory {
  static default(): PasswordRecoveriesDataSource {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresPasswordRecoveries) {
      return new PostgresPasswordRecoveriesDataSource({
        tenantId: tenant.name,
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
        idGenerator: IdGeneratorFactory.default(),
      });
    }

    return new MongoPasswordRecoveriesDataSource({
      db: getConnection(),
      transactionManager: ExecutionContext.transactionManager,
    });
  }
}

export { PasswordRecoveriesDataSourceFactory };
