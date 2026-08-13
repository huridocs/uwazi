import { PUBLIC_USER_ID } from '#api/core/domain/user/User.js';
import type { UserRow } from './PostgresUserRow.js';

const PUBLIC_USER_ID_STRING = PUBLIC_USER_ID.toHexString();

/**
 * The read vocabulary for PostgresUsersDAO.
 *
 * Deliberately duplicated from the Mongo DAO's UserReadOptions rather than shared: this is
 * a naming convention, not a cross-backend interface. A shared type here would be the first
 * step back toward a shared DAO contract, which is what forces a lowest-common-denominator
 * query vocabulary (see plans/users-refactor-00-decisions.md#d4).
 *
 * The two copies must agree on *policy* — the same scope defaults, the same field-group
 * membership — not on signatures. Mongo resolves groups to a projection; here they resolve
 * to a column list.
 */

/**
 * The two guard axes, applied uniformly on every read, both defaulting to `exclude`
 * (D5). Nothing outside the DAO composes guards.
 */
type UserScope = {
  deleted?: 'exclude' | 'include';
  systemUser?: 'exclude' | 'include';
};

/**
 * Named groups of sensitive fields, replacing the five independent `includeX` booleans
 * that made 32 combinations of which ~4 were real (D6). The DAO does not know *why*
 * anyone wants a group — that is what keeps it business-agnostic while safe by default.
 */
type UserFieldGroup = 'identity' | 'status' | 'credentials' | 'security';

type ReadOptions = {
  scope?: UserScope;
  fields?: UserFieldGroup[];
};

const DEFAULT_SCOPE: Required<UserScope> = { deleted: 'exclude', systemUser: 'exclude' };

const DEFAULT_FIELDS: UserFieldGroup[] = ['identity'];

const COLUMNS_BY_GROUP: Record<UserFieldGroup, (keyof UserRow)[]> = {
  identity: ['_id', 'username', 'role', 'email'],
  status: ['using2fa', 'accountLocked', 'deletedAt'],
  credentials: ['password'],
  security: ['secret', 'failedLogins', 'accountUnlockCode'],
};

/**
 * Field-by-field rather than spread, so an explicitly-passed `undefined` falls back to the
 * default instead of erasing the guard.
 */
const resolveScope = (scope: UserScope = {}): Required<UserScope> => ({
  deleted: scope.deleted ?? DEFAULT_SCOPE.deleted,
  systemUser: scope.systemUser ?? DEFAULT_SCOPE.systemUser,
});

/**
 * Resolves field groups to an explicit column list. Selecting named columns rather than
 * `*` is what makes the default safe: a column added to the users table later is absent
 * from reads until someone puts it in a group on purpose.
 */
const resolveColumns = (fields: UserFieldGroup[] = DEFAULT_FIELDS): (keyof UserRow)[] => {
  // identity is always included even when not listed — every caller needs `_id`.
  const groups = new Set<UserFieldGroup>(['identity', ...fields]);

  return [...new Set([...groups].flatMap(group => COLUMNS_BY_GROUP[group]))];
};

/**
 * The guard policy, in the two renderings this backend needs. They are declared adjacent
 * on purpose: `findWithGroups` cannot go through the query builder (JSONB containment is
 * not expressible in it), so the policy has to exist as SQL as well — and two renderings
 * that drift are exactly the failure D5 exists to prevent. Change one, change the other.
 */

/** Builder rendering: chained onto a PostgresTable by the DAO's `scoped()`. */
const scopePredicates = (
  scope?: UserScope
): { excludeDeleted: boolean; excludeSystemUser: boolean } => {
  const { deleted, systemUser } = resolveScope(scope);
  return { excludeDeleted: deleted === 'exclude', excludeSystemUser: systemUser === 'exclude' };
};

/**
 * Raw-SQL rendering, for `findWithGroups`. `prefix` is the table alias including its dot
 * (`'u.'`), or empty for an unaliased table. Emits `TRUE` rather than an empty string so
 * it is always safe to drop into a `WHERE`.
 */
const scopeSql = (scope?: UserScope, prefix = ''): { sql: string; bindings: unknown[] } => {
  const { excludeDeleted, excludeSystemUser } = scopePredicates(scope);
  const clauses: string[] = [];
  const bindings: unknown[] = [];

  if (excludeDeleted) {
    clauses.push(`${prefix}"deletedAt" IS NULL`);
  }
  if (excludeSystemUser) {
    clauses.push(`${prefix}"_id" <> ?`);
    bindings.push(PUBLIC_USER_ID_STRING);
  }

  return { sql: clauses.length ? clauses.join(' AND ') : 'TRUE', bindings };
};

export type { UserScope, UserFieldGroup, ReadOptions };
export {
  PUBLIC_USER_ID_STRING,
  DEFAULT_SCOPE,
  DEFAULT_FIELDS,
  COLUMNS_BY_GROUP,
  resolveScope,
  resolveColumns,
  scopePredicates,
  scopeSql,
};
