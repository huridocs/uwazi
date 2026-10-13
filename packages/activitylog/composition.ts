import type { Application, RequestHandler } from 'express';
import type { Register } from '../../app/queueRegistry.js';
import { ScheduleActivityLogArchivesJobFactory } from './infrastructure/factories/ScheduleActivityLogArchivesJobFactory.js';
import { ActivityLogMiddleware } from './infrastructure/http/ActivityLogMiddleware.js';
import { ActivityLogRoutes } from './infrastructure/http/ActivityLogRoutes.js';
import { ArchiveActivityOverflowJobHandler } from './infrastructure/jobs/ArchiveActivityOverflowJobHandler.js';
import { ScheduleActivityLogArchivesJob } from './infrastructure/jobs/ScheduleActivityLogArchivesJob.js';
import { ScheduleActivityLogArchivesJobScheduler } from './infrastructure/jobs/ScheduleActivityLogArchivesJobScheduler.js';

/** How the host wires the activity log module in. */
class ActivityLogComposition {
  /** Mounted once, before every route, so each answered request is logged. */
  static readonly middleware: RequestHandler = ActivityLogMiddleware.handle;

  static registerRoutes(app: Application) {
    ActivityLogRoutes.register(app);
  }

  static registerJobs(register: Register) {
    register(ScheduleActivityLogArchivesJob, async () =>
      ScheduleActivityLogArchivesJobFactory.default()
    );

    register(ArchiveActivityOverflowJobHandler, async () =>
      ArchiveActivityOverflowJobHandler.default()
    );
  }

  /** Starts the daily run that archives what tenants hold beyond the limit. */
  static async ensureArchivingScheduled() {
    await ScheduleActivityLogArchivesJobScheduler.default().ensureScheduled();
  }
}

export { ActivityLogComposition };
