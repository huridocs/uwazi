import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import type { ActivityLogQueryService } from '../../application/contracts/ActivityLogQueryService.js';
import { MongoActivityLogQueryService } from '../mongodb/MongoActivityLogQueryService.js';
import { ActivityDescriberFactory } from './ActivityDescriberFactory.js';

/** The activity log has not moved to PostgreSQL: every tenant reads it from MongoDB. */
class ActivityLogQueryServiceFactory {
  static default(): ActivityLogQueryService {
    return new MongoActivityLogQueryService(getConnection(), ActivityDescriberFactory.default());
  }
}

export { ActivityLogQueryServiceFactory };
