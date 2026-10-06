import { z } from 'zod';
import { LazyModule } from '../../routing/LazyModule.js';
import type { Route } from '../../routing/Route.js';
import type { DeletedUserOutput } from '../contracts.js';
import { UserReference, UserReferenceInput } from '../UserReference.js';

class DeleteUserRoute implements Route<UserReferenceInput, DeletedUserOutput> {
  readonly group = 'users';

  readonly name = 'delete';

  readonly describe = 'Soft-delete a user';

  readonly tenancy = 'single';

  readonly needs = { redis: false };

  readonly request = z.object(UserReference.shape).strict().superRefine(UserReference.refine);

  readonly fieldMap = {};

  private readonly controller = new LazyModule(
    async () => import('../controllers/DeleteUserController.js')
  );

  async handle(input: UserReferenceInput): Promise<DeletedUserOutput> {
    const { DeleteUserController } = await this.controller.get();
    return DeleteUserController.handle(input);
  }
}

export { DeleteUserRoute };
