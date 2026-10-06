import type { Route } from '../routing/Route.js';
import { UsageReportRoute } from './routes/UsageReportRoute.js';

/** `uwazi usage …` */
class UsageRoutes {
  static all(): Route[] {
    return [new UsageReportRoute()];
  }
}

export { UsageRoutes };
