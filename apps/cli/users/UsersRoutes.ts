import type { Route } from '../routing/Route.js';
import { CreateUserRoute } from './routes/CreateUserRoute.js';
import { DeleteUserRoute } from './routes/DeleteUserRoute.js';
import { ListUsersRoute } from './routes/ListUsersRoute.js';
import { UpdateUserRoute } from './routes/UpdateUserRoute.js';
import { UserStatsRoute } from './routes/UserStatsRoute.js';

/** `uwazi users …` */
class UsersRoutes {
  static all(): Route[] {
    return [
      new CreateUserRoute(),
      new UpdateUserRoute(),
      new DeleteUserRoute(),
      new ListUsersRoute(),
      new UserStatsRoute(),
    ];
  }
}

export { UsersRoutes };
