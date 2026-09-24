import { UsersRoutes } from '../users/UsersRoutes.js';
import type { Route } from './Route.js';

/** Every command the `uwazi` binary knows. Resource routes are added here as they are built. */
class RouteRegistry {
  static all(): Route[] {
    return [...UsersRoutes.all()];
  }
}

export { RouteRegistry };
