import type { RequestHandler } from 'express';
import { ActivityLogMiddleware } from './infrastructure/http/ActivityLogMiddleware.js';

/** How the host wires the activity log module in. */
class ActivityLogComposition {
  /** Mounted once, before every route, so each answered request is logged. */
  static readonly middleware: RequestHandler = ActivityLogMiddleware.handle;
}

export { ActivityLogComposition };
