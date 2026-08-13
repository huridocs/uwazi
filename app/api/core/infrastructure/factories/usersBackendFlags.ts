import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';

type UsersBackend = 'postgres' | 'mongo';

/**
 * Which backend serves users, for the contracts that read users **and** their groups
 * (D8 in plans/users-refactor-00-decisions.md).
 *
 * `postgresUsers` and `postgresUsergroups` must agree. UsersQueryService.listUsers and
 * UsersDirectory.getProfile/getActor join the two collections, so a mixed configuration
 * cannot be served correctly by either backend. It is rejected rather than silently
 * degraded: the alternative is a DAO reading one database while its groups DAO reads the
 * other, which surfaces as an opaque query-time error — or worse, as an empty groups array,
 * i.e. a silent loss of permissions.
 *
 * One definition shared by UsersDirectoryFactory, UsersQueryServiceFactory and
 * UserGroupsDAOFactory. Three copies of a rule this consequential is three chances to drift.
 */
const resolveUsersBackend = (contract: string): UsersBackend => {
  const tenant = ExecutionContext.currentTenant;
  const postgresUsers = Boolean(tenant.featureFlags?.postgresUsers);
  const postgresUsergroups = Boolean(tenant.featureFlags?.postgresUsergroups);

  if (postgresUsers !== postgresUsergroups) {
    throw new Error(
      `${contract} requires the postgresUsers and postgresUsergroups feature flags to be ` +
        `enabled together, but got postgresUsers=${postgresUsers} and ` +
        `postgresUsergroups=${postgresUsergroups} for tenant "${tenant.name}".`
    );
  }

  return postgresUsers ? 'postgres' : 'mongo';
};

/**
 * Whether a call site reads users through `UsersDirectory` instead of its legacy v1 path
 * (D8). The rollout switch for plan 05, and it disappears with the flag in the follow-up PR.
 *
 * `postgresUsers` is part of the condition on purpose. The sites this gates used to branch
 * on that flag themselves, routing to `UsersDAOFactory` when it was on — so for a tenant
 * already on Postgres the Directory *is* the current path, not a new one. Gating on
 * `usersDirectory` alone would silently move those reads back to Mongo, which reads as data
 * loss to anyone mid-migration. Mongo tenants keep the rollback lever the flag exists for;
 * Postgres tenants never had one here.
 *
 * It lives beside `resolveUsersBackend` so no call site has to name a backend flag itself.
 */
const usersDirectoryEnabled = (): boolean => {
  const flags = ExecutionContext.currentTenant.featureFlags;

  return Boolean(flags?.usersDirectory || flags?.postgresUsers);
};

export { resolveUsersBackend, usersDirectoryEnabled };
export type { UsersBackend };
