import { TTL_SECONDS, type SessionsBackend } from '#api/auth/httpSessionStore.js';
import { config } from '#api/config.js';
import { getSharedConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import type { ActivityReader } from '../../application/contracts/ActivityReader.js';
import { MongoActivityReader } from '../sessions/MongoActivityReader.js';
import { PostgresActivityReader } from '../sessions/PostgresActivityReader.js';

/** Sessions follow the installation's SESSIONS_BACKEND, not the tenant's feature flags. */
class ActivityReaderFactory {
  static default(backend: SessionsBackend = config.sessionsBackend): ActivityReader {
    if (backend === 'postgres') {
      return new PostgresActivityReader({ pool: PostgresDB.pool(), ttlSeconds: TTL_SECONDS });
    }

    return new MongoActivityReader({ sharedDb: getSharedConnection(), ttlMs: TTL_SECONDS * 1000 });
  }
}

export { ActivityReaderFactory };
