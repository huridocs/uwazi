import { z } from 'zod';
import type { Route } from '../../routing/Route.js';
import type { RoleCountsOutput } from '../contracts.js';
import { UserStatsController } from '../controllers/UserStatsController.js';

const NoInput = z.object({}).strict();
type NoInput = z.infer<typeof NoInput>;

class UserStatsRoute implements Route<NoInput, RoleCountsOutput> {
  readonly group = 'users';

  readonly name = 'stats';

  readonly describe = 'Count active users by role, for a tenant or every tenant';

  readonly tenancy = 'single-or-all';

  readonly needs = { redis: false };

  /** Takes no input of its own: --tenant / --all-tenants come from its tenancy. */
  readonly request = NoInput;

  readonly fieldMap = {};

  private readonly controller = UserStatsController;

  async handle(): Promise<RoleCountsOutput> {
    return this.controller.handle();
  }
}

export { UserStatsRoute };
