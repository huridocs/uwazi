import { z } from 'zod';
import { UserRole } from '#api/core/domain/user/User.js';
import type { Route } from '../../routing/Route.js';
import type { CreatedUserOutput } from '../contracts.js';
import { CreateUserCliInput, CreateUserController } from '../controllers/CreateUserController.js';

class CreateUserRoute implements Route<CreateUserCliInput, CreatedUserOutput> {
  readonly group = 'users';

  readonly name = 'create';

  readonly describe = 'Create a user in a tenant';

  readonly tenancy = 'single';

  readonly needs = { redis: false };

  readonly request = z
    .object({
      username: z.string(),
      email: z.string(),
      role: z.nativeEnum(UserRole),
      groups: z.array(z.string()).default([]).describe('User group ids'),
      welcomeEmail: z.boolean().default(true).describe('Queue the welcome email'),
    })
    .strict();

  readonly fieldMap = { assignedGroupIds: 'groups' };

  private readonly controller = CreateUserController;

  async handle(input: CreateUserCliInput): Promise<CreatedUserOutput> {
    return this.controller.handle(input);
  }
}

export { CreateUserRoute };
