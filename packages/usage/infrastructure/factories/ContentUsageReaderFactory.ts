import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import type { ContentUsageReader } from '../../application/contracts/ContentUsageReader.js';
import { MongoContentUsageReader } from '../mongodb/MongoContentUsageReader.js';
import { PostgresContentUsageReader } from '../postgresql/PostgresContentUsageReader.js';

class ContentUsageReaderFactory {
  static default(): ContentUsageReader {
    const tenant = ExecutionContext.currentTenant;

    if (tenant.featureFlags?.postgresCore) {
      return new PostgresContentUsageReader({
        tenantId: tenant.name,
        pgTransactionManager: ExecutionContext.postgresTransactionManager,
      });
    }

    return new MongoContentUsageReader(getConnection());
  }
}

export { ContentUsageReaderFactory };
