import type { Route } from '../routing/Route.js';
import { ListActivityRoute } from './routes/ListActivityRoute.js';

/** `uwazi activity …` */
class ActivityRoutes {
  static all(): Route[] {
    return [new ListActivityRoute()];
  }
}

export { ActivityRoutes };
