import type { Argv } from 'yargs';
import { z } from 'zod';
import { UserRole } from '#api/core/domain/user/User.js';
import type { CliArgv, Route } from '../../routing/Route.js';
import type { UserListItem } from '../contracts.js';
import { ListUsersCliInput, ListUsersController } from '../controllers/ListUsersController.js';
import { UserFlags } from './UserFlags.js';

class ListUsersRoute implements Route<ListUsersCliInput, UserListItem[]> {
  readonly group = 'users';

  readonly name = 'list';

  readonly describe = 'List the active users of a tenant, or of every tenant';

  readonly tenancy = 'single-or-all';

  readonly needs = { redis: false };

  readonly fieldMap = { role: '--role' };

  private readonly flags = { role: UserFlags.role } as const;

  private readonly schema = z.object({ role: z.nativeEnum(UserRole).optional() });

  private readonly controller = ListUsersController;

  options(yargs: Argv): Argv {
    return yargs.options(this.flags);
  }

  toInput(argv: CliArgv): ListUsersCliInput {
    return this.schema.parse(argv);
  }

  async handle(input: ListUsersCliInput): Promise<UserListItem[]> {
    return this.controller.handle(input);
  }
}

export { ListUsersRoute };
