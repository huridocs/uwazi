import { z } from 'zod';
import { UserRole } from '#api/core/domain/user/User.js';
import type { Route } from '../../routing/Route.js';
import type { UserListItem } from '../contracts.js';
import { ListUsersCliInput, ListUsersController } from '../controllers/ListUsersController.js';

class ListUsersRoute implements Route<ListUsersCliInput, UserListItem[]> {
  readonly group = 'users';

  readonly name = 'list';

  readonly describe = 'List the active users of a tenant, or of every tenant';

  readonly tenancy = 'single-or-all';

  readonly needs = { redis: false };

  readonly request = z.object({ role: z.nativeEnum(UserRole).optional() }).strict();

  readonly fieldMap = {};

  private readonly controller = ListUsersController;

  async handle(input: ListUsersCliInput): Promise<UserListItem[]> {
    return this.controller.handle(input);
  }
}

export { ListUsersRoute };
