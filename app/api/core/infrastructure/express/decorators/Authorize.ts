import { UserRole } from '#shared/types/userSchema.js';

import { guardHandle } from './guardHandle.js';

/** Controller counterpart of `needsAuthorization` (app/api/auth/authMiddleware.ts). */
export function Authorize(roles: `${UserRole}`[] = [UserRole.ADMIN]) {
  return guardHandle(request => {
    const role = request.user?.role;
    if (role && roles.includes(role)) {
      return undefined;
    }

    return { status: 401, body: { error: 'Unauthorized', message: 'Unauthorized' } };
  });
}
