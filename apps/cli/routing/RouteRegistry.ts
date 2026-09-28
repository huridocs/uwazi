import { SegmentationRoutes } from '../segmentation/SegmentationRoutes.js';
import { SettingsRoutes } from '../settings/SettingsRoutes.js';
import { TenantsRoutes } from '../tenants/TenantsRoutes.js';
import { UsersRoutes } from '../users/UsersRoutes.js';
import type { Route } from './Route.js';

/** Every command the `uwazi` binary knows. Resource routes are added here as they are built. */
class RouteRegistry {
  static all(): Route[] {
    return [
      ...UsersRoutes.all(),
      ...SettingsRoutes.all(),
      ...TenantsRoutes.all(),
      ...SegmentationRoutes.all(),
    ];
  }
}

export { RouteRegistry };
