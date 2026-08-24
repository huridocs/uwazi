import type { Document, Filter } from 'mongodb';
import { PUBLIC_USER_ID } from '#api/core/domain/user/User.js';
import type { UserDBO } from './UserDBO.js';

/**
 * The read vocabulary for MongoUsersDAO.
 *
 * Deliberately duplicated in the Postgres DAO's UserReadOptions rather than shared: this is
 * a naming convention, not a cross-backend interface. A shared type here would be the first
 * step back toward a shared DAO contract, which is what forces a lowest-common-denominator
 * query vocabulary (see plans/users-refactor-00-decisions.md#d4).
 *
 * The two copies must agree on *policy* — the same scope defaults, the same field-group
 * membership — not on signatures.
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

const FIELDS_BY_GROUP: Record<UserFieldGroup, string[]> = {
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
 * Resolves field groups to an *inclusion* projection. Inclusion rather than exclusion is
 * what makes the default safe: a field added to UserDBO later is absent from reads until
 * someone puts it in a group on purpose.
 */
const resolveProjection = (fields: UserFieldGroup[] = DEFAULT_FIELDS): Document => {
  // identity is always included even when not listed — every caller needs `_id`.
  const groups = new Set<UserFieldGroup>(['identity', ...fields]);

  return Object.fromEntries(
    [...groups].flatMap(group => FIELDS_BY_GROUP[group]).map(field => [field, 1])
  );
};

/**
 * The guard predicates for a resolved scope — the single definition of what "excluded"
 * means on this backend (D5). Returned as a list rather than one merged object because
 * the system-user guard constrains `_id`, and merging it into a caller filter that also
 * constrains `_id` would silently *replace* the caller's predicate. Compose with `$and`.
 */
const scopeFilters = (scope?: UserScope): Filter<UserDBO>[] => {
  const { deleted, systemUser } = resolveScope(scope);

  return [
    ...(deleted === 'exclude' ? [{ deletedAt: { $exists: false } }] : []),
    ...(systemUser === 'exclude' ? [{ _id: { $ne: PUBLIC_USER_ID } }] : []),
  ] as Filter<UserDBO>[];
};

const applyScope = (filter: Filter<UserDBO>, scope?: UserScope): Filter<UserDBO> => {
  const clauses = [filter, ...scopeFilters(scope)].filter(clause => Object.keys(clause).length > 0);

  if (clauses.length === 0) return {};
  if (clauses.length === 1) return clauses[0];
  return { $and: clauses };
};

export type { UserScope, UserFieldGroup, ReadOptions };
export {
  DEFAULT_SCOPE,
  DEFAULT_FIELDS,
  FIELDS_BY_GROUP,
  resolveScope,
  resolveProjection,
  scopeFilters,
  applyScope,
};
