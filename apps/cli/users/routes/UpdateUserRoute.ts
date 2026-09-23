import type { Argv } from 'yargs';
import { z } from 'zod';
import { UserRole } from '#api/core/domain/user/User.js';
import type { CliArgv, Route } from '../../routing/Route.js';
import type { UpdatedUserOutput } from '../contracts.js';
import { UpdateUserCliInput, UpdateUserController } from '../controllers/UpdateUserController.js';
import { UserReference } from '../UserReference.js';
import { UserFlags } from './UserFlags.js';

class UpdateUserRoute implements Route<UpdateUserCliInput, UpdatedUserOutput> {
  readonly group = 'users';

  readonly name = 'update';

  readonly describe = 'Change a user; omitted fields stay as they are';

  readonly tenancy = 'single';

  readonly needs = { redis: false };

  /** `username` in domain errors is the new one: the user is named by --username | --id. */
  readonly fieldMap = {
    user: '--username | --id',
    id: '--id',
    newUsername: '--new-username',
    username: '--new-username',
    email: '--email',
    role: '--role',
    groups: '--groups',
    assignedGroupIds: '--groups',
  };

  private readonly flags = {
    ...UserReference.flags,
    'new-username': { type: 'string', describe: 'New username' },
    email: UserFlags.email,
    role: UserFlags.role,
    groups: UserFlags.groups,
  } as const;

  private readonly schema = z
    .object({
      ...UserReference.shape,
      newUsername: z.string().optional(),
      email: z.string().optional(),
      role: z.nativeEnum(UserRole).optional(),
      groups: z.array(z.string()).optional(),
    })
    .superRefine(UserReference.refine);

  private readonly controller = UpdateUserController;

  options(yargs: Argv): Argv {
    return yargs.options(this.flags);
  }

  toInput(argv: CliArgv): UpdateUserCliInput {
    return this.schema.parse(argv);
  }

  async handle(input: UpdateUserCliInput): Promise<UpdatedUserOutput> {
    return this.controller.handle(input);
  }
}

export { UpdateUserRoute };
