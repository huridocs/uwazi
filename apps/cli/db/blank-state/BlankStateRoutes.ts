import type { Route } from '../../routing/Route.js';
import { DumpBlankStateRoute } from './routes/DumpBlankStateRoute.js';
import { RestoreBlankStateRoute } from './routes/RestoreBlankStateRoute.js';

/** `uwazi db blank-state …` */
class BlankStateRoutes {
  static all(): Route[] {
    return [new DumpBlankStateRoute(), new RestoreBlankStateRoute()];
  }
}

export { BlankStateRoutes };
