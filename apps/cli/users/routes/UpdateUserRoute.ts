import { z } from 'zod';
import { UserRole } from '#api/core/domain/user/User.js';
import type { Route } from '../../routing/Route.js';
import type { UpdatedUserOutput } from '../contracts.js';
import { UpdateUserCliInput, UpdateUserController } from '../controllers/UpdateUserController.js';
import { UserReference } from '../UserReference.js';

class UpdateUserRoute implements Route<UpdateUserCliInput, UpdatedUserOutput> {
  readonly group = 'users';

  readonly name = 'update';

  readonly describe = 'Change a user; omitted fields stay as they are';

  readonly tenancy = 'single';

  readonly needs = { redis: false };

  readonly request = z
    .object({
      ...UserReference.shape,
      newUsername: z.string().optional(),
      email: z.string().optional(),
      role: z.nativeEnum(UserRole).optional(),
      groups: z.array(z.string()).optional().describe('User group ids'),
    })
    .strict()
    .superRefine(UserReference.refine);

  /** `username` in domain errors is the new one: the user is named by `username` | `id`. */
  readonly fieldMap = { username: 'newUsername', assignedGroupIds: 'groups' };

  private readonly controller = UpdateUserController;

  async handle(input: UpdateUserCliInput): Promise<UpdatedUserOutput> {
    return this.controller.handle(input);
  }
}

export { UpdateUserRoute };
