import type { Application, RequestHandler } from 'express';
import { ActivityLogMiddleware } from './infrastructure/http/ActivityLogMiddleware.js';
import { ActivityLogRoutes } from './infrastructure/http/ActivityLogRoutes.js';

/** How the host wires the activity log module in. */
class ActivityLogComposition {
  /** Mounted once, before every route, so each answered request is logged. */
  static readonly middleware: RequestHandler = ActivityLogMiddleware.handle;

  static registerRoutes(app: Application) {
    ActivityLogRoutes.register(app);
  }
}

export { ActivityLogComposition };
