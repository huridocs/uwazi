import type { Route } from '../routing/Route.js';
import { ListArchivesRoute } from './routes/ListArchivesRoute.js';

/** `uwazi archives …` */
class ArchivesRoutes {
  static all(): Route[] {
    return [new ListArchivesRoute()];
  }
}

export { ArchivesRoutes };
