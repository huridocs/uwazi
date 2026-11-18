import type { GetUsersResponse } from '#shared/contracts/Users.js';
import type { UserSchema } from '#shared/types/userType.js';

/** GET /api/users (admins only) */
type UsersResponse = GetUsersResponse;

/** GET /api/user: the logged-in user, or an empty object when anonymous. */
type CurrentUserResponse = UserSchema | Record<string, never>;

export type { UsersResponse, CurrentUserResponse };
