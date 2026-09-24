import { z } from 'zod';
import type { Route } from '../../routing/Route.js';
import type { DeletedUserOutput } from '../contracts.js';
import { DeleteUserController } from '../controllers/DeleteUserController.js';
import { UserReference, UserReferenceInput } from '../UserReference.js';

class DeleteUserRoute implements Route<UserReferenceInput, DeletedUserOutput> {
  readonly group = 'users';

  readonly name = 'delete';

  readonly describe = 'Soft-delete a user';

  readonly tenancy = 'single';

  readonly needs = { redis: false };

  readonly request = z.object(UserReference.shape).strict().superRefine(UserReference.refine);

  readonly fieldMap = {};

  private readonly controller = DeleteUserController;

  async handle(input: UserReferenceInput): Promise<DeletedUserOutput> {
    return this.controller.handle(input);
  }
}

export { DeleteUserRoute };
