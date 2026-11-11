import type { Route } from '../routing/Route.js';
import { ListArchivesRoute } from './routes/ListArchivesRoute.js';

/** `uwazi archives …` — deprecated alias of `tenants list --archived`, kept temporarily. */
class ArchivesRoutes {
  static all(): Route[] {
    return [new ListArchivesRoute()];
  }
}

export { ArchivesRoutes };
