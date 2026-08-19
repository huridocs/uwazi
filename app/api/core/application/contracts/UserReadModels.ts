import type { UserRole } from '#api/core/domain/user/User.js';
import type { GroupSummary } from '#shared/contracts/UserGroups.js';

/**
 * The two read models every users read returns (D2 in plans/users-refactor-00-decisions.md).
 *
 * They are declared as exact object types, never as an intersection with a DBO or a row
 * type. That is deliberate: `UserDBO & { groups }` is what leaks `password?` / `secret?` /
 * `deletedAt` all the way into ServerUsersService today, and any structural extension of a
 * persistence type re-opens that hole the moment a column is added.
 *
 * They are **server-side** models. `#shared/contracts/Users.ts` remains the wire contract
 * and controllers map across the boundary, so the two can version independently.
 *
 * They live here rather than in `domain/` because they are read projections, not
 * aggregates — `domain/user/` owns `User`/`UserAccount`, which are the write side.
 *
 * Both are built **only** by the backend mappers (`MongoUsersMapper` /
 * `PostgresUsersMapper`). Nothing constructs one structurally.
 */

/** Identity: who is this, and what may I call them. Safe for any internal reader. */
type UserView = {
  _id: string;
  username: string;
  /** The domain enum, not the string unions redeclared in the shared/v2 contracts. */
  role: UserRole;
  email: string;
};

/**
 * Identity plus account state and group membership. Two audiences only: the authenticated
 * subject itself (session, getCurrent, job actors — group membership drives permissions)
 * and an admin managing accounts. Nobody else gets to know whether a colleague has 2FA on.
 *
 * `using2fa` and `accountLocked` are required here and optional in the DBO/row; the mappers
 * coerce them with `Boolean(...)`.
 */
type UserProfile = UserView & {
  groups: GroupSummary[];
  using2fa: boolean;
  accountLocked: boolean;
};

export type { UserView, UserProfile };
