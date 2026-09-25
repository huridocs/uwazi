import { UserNotFound } from '#api/core/domain/user/errors.js';
import { UsersQueryServiceFactory } from '#api/core/infrastructure/factories/UsersQueryServiceFactory.js';
import type { UserReferenceInput } from './UserReference.js';

/**
 * Finds the user a request names. Kept apart from UserReference, which routes load for its
 * schema, because the lookup pulls in the users backend.
 */
class UserResolver {
  /** Must run inside the tenant: only active users are found. */
  static async resolveId({ username, id }: UserReferenceInput): Promise<string> {
    if (id) {
      return id;
    }

    const user = await UsersQueryServiceFactory.default().findByUsername(username ?? '');
    if (!user) {
      throw new UserNotFound(username ?? '');
    }

    return user._id;
  }
}

export { UserResolver };
