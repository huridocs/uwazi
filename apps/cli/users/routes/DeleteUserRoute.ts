import type { Argv } from 'yargs';
import { z } from 'zod';
import type { CliArgv, Route } from '../../routing/Route.js';
import type { DeletedUserOutput } from '../contracts.js';
import { DeleteUserController } from '../controllers/DeleteUserController.js';
import { UserReference, UserReferenceInput } from '../UserReference.js';

class DeleteUserRoute implements Route<UserReferenceInput, DeletedUserOutput> {
  readonly group = 'users';

  readonly name = 'delete';

  readonly describe = 'Soft-delete a user';

  readonly tenancy = 'single';

  readonly needs = { redis: false };

  readonly fieldMap = { user: '--username | --id', username: '--username', id: '--id' };

  private readonly flags = UserReference.flags;

  private readonly schema = z.object(UserReference.shape).superRefine(UserReference.refine);

  private readonly controller = DeleteUserController;

  options(yargs: Argv): Argv {
    return yargs.options(this.flags);
  }

  toInput(argv: CliArgv): UserReferenceInput {
    return this.schema.parse(argv);
  }

  async handle(input: UserReferenceInput): Promise<DeletedUserOutput> {
    return this.controller.handle(input);
  }
}

export { DeleteUserRoute };
