import { UsersDirectoryFactory } from '#api/core/infrastructure/factories/UsersDirectoryFactory.js';
import { usersDirectoryEnabled } from '#api/core/infrastructure/factories/usersBackendFlags.js';

/**
 * Temporary V1 bridge: loads the legacy `users` module lazily.
 *
 * A static import of `#api/users/users.js` from UwaziJobHandler creates a
 * circular dependency (users.js → mailer → settings → ... → DispatcherAdapter
 * → job handlers → UwaziJobHandler → users.js), which breaks module
 * evaluation. Deferring the load to call time breaks the cycle.
 *
 * The `users` module is legacy V1 code that will disappear once the V2 users
 * module is complete; this bridge can be removed together with it.
 */
export async function getUserById(userId: string) {
  // getActor: job actors need their groups (they drive permission checks inside the job)
  // and must resolve even once soft-deleted, which is exactly what this method is for
  // (D3/D9). `getData()` yields undefined on a miss so UwaziJobHandler keeps throwing its
  // own "User not found" rather than a UserNotFound.
  if (usersDirectoryEnabled()) {
    return (await UsersDirectoryFactory.default().getActor(userId)).getData() ?? null;
  }

  const { default: users } = await import('#api/users/users.js');
  return users.getById(userId, '-password', true, true);
}
