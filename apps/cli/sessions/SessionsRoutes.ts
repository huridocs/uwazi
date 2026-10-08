import type { Route } from '../routing/Route.js';
import { SessionsLastRoute } from './routes/SessionsLastRoute.js';

/** `uwazi sessions …` */
class SessionsRoutes {
  static all(): Route[] {
    return [new SessionsLastRoute()];
  }
}

export { SessionsRoutes };
