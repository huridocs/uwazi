import { CaptchaDataSource } from '#api/core/application/contracts/CaptchaDataSource.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { MongoCaptchaDataSource } from '#api/core/infrastructure/mongodb/captcha/MongoCaptchaDataSource.js';
import { PostgresCaptchaDataSource } from '#api/core/infrastructure/postgresql/captcha/PostgresCaptchaDataSource.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { IdGeneratorFactory } from './IdGeneratorFactory.js';

class CaptchaDataSourceFactory {
  static default(): CaptchaDataSource {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresCaptchas) {
      return new PostgresCaptchaDataSource({
        tenantId: tenant.name,
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
        idGenerator: IdGeneratorFactory.default(),
      });
    }

    return new MongoCaptchaDataSource({
      db: getConnection(),
      transactionManager: ExecutionContext.transactionManager,
    });
  }
}

export { CaptchaDataSourceFactory };
