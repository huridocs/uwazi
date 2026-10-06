import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import type { FootprintReader } from '../../application/contracts/FootprintReader.js';
import { MongoFootprintReader } from '../mongodb/MongoFootprintReader.js';
import { PostgresFootprintReader } from '../postgresql/PostgresFootprintReader.js';

/** One reader per engine: a tenant can have data in both while its migration is under way. */
class FootprintReaderFactory {
  static mongo(): FootprintReader {
    return new MongoFootprintReader(getConnection());
  }

  static postgres(): FootprintReader {
    return new PostgresFootprintReader({
      tenantId: ExecutionContext.currentTenant.name,
      pgTransactionManager: ExecutionContext.postgresTransactionManager,
    });
  }
}

export { FootprintReaderFactory };
