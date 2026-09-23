import type { Argv } from 'yargs';
import { z } from 'zod';
import type { CliArgv, Route } from '../../routing/Route.js';
import type { RoleCountsOutput } from '../contracts.js';
import { UserStatsController } from '../controllers/UserStatsController.js';

const NoInput = z.object({});

type NoInput = z.infer<typeof NoInput>;

class UserStatsRoute implements Route<NoInput, RoleCountsOutput> {
  readonly group = 'users';

  readonly name = 'stats';

  readonly describe = 'Count active users by role, for a tenant or every tenant';

  readonly tenancy = 'single-or-all';

  readonly needs = { redis: false };

  readonly fieldMap = {};

  /** No flags of its own: --tenant / --all-tenants come from its tenancy. */
  private readonly flags = {};

  private readonly schema = NoInput;

  private readonly controller = UserStatsController;

  options(yargs: Argv): Argv {
    return yargs.options(this.flags);
  }

  toInput(argv: CliArgv): NoInput {
    return this.schema.parse(argv);
  }

  async handle(): Promise<RoleCountsOutput> {
    return this.controller.handle();
  }
}

export { UserStatsRoute };
