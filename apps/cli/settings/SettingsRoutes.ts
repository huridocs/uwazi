import type { Route } from '../routing/Route.js';
import { GetSettingsRoute } from './routes/GetSettingsRoute.js';
import { UpdateSettingsRoute } from './routes/UpdateSettingsRoute.js';

/** `uwazi settings …` */
class SettingsRoutes {
  static all(): Route[] {
    return [new GetSettingsRoute(), new UpdateSettingsRoute()];
  }
}

export { SettingsRoutes };
