import { ExecutionContextFactory } from '#api/core/infrastructure/factories/ExecutionContextFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { tenants } from '#api/tenants/index.js';
import { User } from '#api/users.v2/model/User.js';
// eslint-disable-next-line import/no-cycle
import { FailStaleOcrRecordsJobHandler } from '../jobs/FailStaleOcrRecordsJobHandler.js';
import { ScheduleStaleOcrSweepJob } from '../jobs/ScheduleStaleOcrSweepJob.js';

class ScheduleStaleOcrSweepJobFactory {
  /** Runs in the system namespace; each sweep is dispatched from inside its tenant's context. */
  static default(): ScheduleStaleOcrSweepJob {
    return new ScheduleStaleOcrSweepJob({
      tenantNames: () => Object.keys(tenants.tenants),
      sweep: async tenantName =>
        ExecutionContextFactory.runForTenant(
          tenantName,
          { actor: User.system(), telemetry: { kind: 'queue_job' } },
          async () => ExecutionContext.jobsDispatcher.dispatch(FailStaleOcrRecordsJobHandler, {})
        ),
      jobsDispatcher: ExecutionContext.jobsDispatcher,
    });
  }
}

export { ScheduleStaleOcrSweepJobFactory };
