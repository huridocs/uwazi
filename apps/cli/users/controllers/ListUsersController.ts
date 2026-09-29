import { UserRole } from '#api/core/domain/user/User.js';
import { UsersQueryServiceFactory } from '#api/core/infrastructure/factories/UsersQueryServiceFactory.js';
import type { UserListItem } from '../contracts.js';
import { UserOutputs } from '../UserOutputs.js';

type ListUsersCliInput = { role?: UserRole };

class ListUsersController {
  static async handle({ role }: ListUsersCliInput): Promise<UserListItem[]> {
    const users = await UsersQueryServiceFactory.default().listUsers();

    return users
      .filter(user => !role || user.role === role)
      .map(user => UserOutputs.listItem(user));
  }
}

export { ListUsersController };
export type { ListUsersCliInput };
