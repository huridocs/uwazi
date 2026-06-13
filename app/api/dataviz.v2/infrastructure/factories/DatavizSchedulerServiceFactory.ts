import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { DatavizSchedulerService } from '../services/DatavizSchedulerService.js';

class DatavizSchedulerServiceFactory {
  static default() {
    return new DatavizSchedulerService({
      jobsDispatcher: ExecutionContext.jobsDispatcher,
      tenantName: ExecutionContext.tenant.name,
    });
  }
}

export { DatavizSchedulerServiceFactory };
