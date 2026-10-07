import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import type { ActivityLogQueryService } from '../../ActivityLogQueryService.js';
import { MongoActivityLogQueryService } from '../mongodb/MongoActivityLogQueryService.js';

/** The activity log has not moved to PostgreSQL: every tenant reads it from MongoDB. */
class ActivityLogQueryServiceFactory {
  static default(): ActivityLogQueryService {
    return new MongoActivityLogQueryService(getConnection());
  }
}

export { ActivityLogQueryServiceFactory };
