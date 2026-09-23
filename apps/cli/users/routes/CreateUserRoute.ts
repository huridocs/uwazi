import type { Argv } from 'yargs';
import { z } from 'zod';
import { UserRole } from '#api/core/domain/user/User.js';
import type { CliArgv, Route } from '../../routing/Route.js';
import type { CreatedUserOutput } from '../contracts.js';
import { CreateUserCliInput, CreateUserController } from '../controllers/CreateUserController.js';
import { UserFlags } from './UserFlags.js';

class CreateUserRoute implements Route<CreateUserCliInput, CreatedUserOutput> {
  readonly group = 'users';

  readonly name = 'create';

  readonly describe = 'Create a user in a tenant';

  readonly tenancy = 'single';

  readonly needs = { redis: false };

  readonly fieldMap = {
    username: '--username',
    email: '--email',
    role: '--role',
    groups: '--groups',
    assignedGroupIds: '--groups',
  };

  private readonly flags = {
    username: { type: 'string', describe: 'Username' },
    email: UserFlags.email,
    role: UserFlags.role,
    groups: UserFlags.groups,
    'welcome-email': {
      type: 'boolean',
      default: true,
      describe: 'Queue the welcome email (--no-welcome-email to skip)',
    },
  } as const;

  private readonly schema = z.object({
    username: z.string(),
    email: z.string(),
    role: z.nativeEnum(UserRole),
    groups: z.array(z.string()).default([]),
    welcomeEmail: z.boolean().default(true),
  });

  private readonly controller = CreateUserController;

  options(yargs: Argv): Argv {
    return yargs.options(this.flags);
  }

  toInput(argv: CliArgv): CreateUserCliInput {
    return this.schema.parse(argv);
  }

  async handle(input: CreateUserCliInput): Promise<CreatedUserOutput> {
    return this.controller.handle(input);
  }
}

export { CreateUserRoute };
