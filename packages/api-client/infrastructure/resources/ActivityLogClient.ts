import { ListActivityLogController } from '#activitylog/composition';

import type { ActivityLogResource } from '../../application/ServerApiClient.js';
import type {
  ActivityLogQuery,
  ActivityLogResponse,
} from '../../application/contracts/ActivityLog.js';
import type { ControllerInvoker } from '../ControllerInvoker.js';

class ActivityLogClient implements ActivityLogResource {
  constructor(private readonly invoker: ControllerInvoker) {}

  async list(query: ActivityLogQuery = {}) {
    return this.invoker.invoke<ActivityLogResponse>(ListActivityLogController, query);
  }
}

export { ActivityLogClient };
