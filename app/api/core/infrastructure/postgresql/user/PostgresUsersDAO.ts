/* eslint-disable class-methods-use-this */
import { UserNotFound } from '#api/core/domain/user/errors.js';
import { Result } from '#api/core/libs/Result.js';
import type { ResultType } from '#api/core/libs/Result.js';
import { PostgresDataSource, PostgresDataSourceDeps } from '../common/PostgresDataSource.js';
import { PostgresTable } from '../common/PostgresTable.js';
import type { UserRow } from './PostgresUserRow.js';
import {
  PUBLIC_USER_ID_STRING,
  COLUMNS_BY_GROUP,
  resolveColumns,
  scopePredicates,
  scopeSql,
} from './UserReadOptions.js';
import type { ReadOptions, UserScope } from './UserReadOptions.js';

type Condition = Record<string, unknown>;

type UserWithGroupsRow = UserRow & { groups: { _id: string; name: string }[] };

/** Every column the users table exposes, used to reject unknown keys before they reach raw SQL. */
const KNOWN_COLUMNS = new Set<string>(Object.values(COLUMNS_BY_GROUP).flat());

/**
 * A private building block, not an interface (D4). Only UsersDataSource, UsersDirectory and
 * UsersQueryService may hold one; an eslint fence enforces that.
 *
 * Two invariants make this safe to use without reading it:
 *   - every read applies the same guards, via `scoped()` (D5)
 *   - every read selects the same named field groups, defaulting to `identity` (D6)
 *
 * It returns raw nullable rows and never a `Result` — absence is not a domain error down
 * here, and wrapping it is the adapter's job.
 *
 * Its method set deliberately does not match MongoUsersDAO's. Each backend speaks its own
 * query language; parity is proven at the contract level, not here.
 */
class PostgresUsersDAO extends PostgresDataSource<UserRow> {
  constructor(deps: PostgresDataSourceDeps) {
    super('users', deps);
  }

  private scoped(table: PostgresTable<UserRow>, scope?: UserScope): PostgresTable<UserRow> {
    const { excludeDeleted, excludeSystemUser } = scopePredicates(scope);

    let query = table;
    if (excludeDeleted) {
      query = query.whereNull('deletedAt');
    }
    if (excludeSystemUser) {
      query = query.whereNot('_id', PUBLIC_USER_ID_STRING);
    }

    return query;
  }

  private read(condition: Condition, options: ReadOptions): PostgresTable<UserRow> {
    return this.scoped(this.table.where(condition), options.scope).select(
      resolveColumns(options.fields)
    );
  }

  async findOne(condition: Condition, options: ReadOptions = {}): Promise<UserRow | undefined> {
    return this.read(condition, options).first();
  }

  async findMany(condition: Condition = {}, options: ReadOptions = {}): Promise<UserRow[]> {
    return this.read(condition, options).all();
  }

  /**
   * `_id IN (...)`, which the equality-only Condition object cannot express, so it is its
   * own method here. Mongo says `findMany({ _id: { $in: ids } })` instead; D4 permits the
   * asymmetry rather than forcing a shared query vocabulary.
   */
  async findManyByIds(ids: string[], options: ReadOptions = {}): Promise<UserRow[]> {
    if (!ids.length) {
      return [];
    }

    return this.scoped(this.table.whereIn('_id', ids), options.scope)
      .select(resolveColumns(options.fields))
      .all();
  }

  /**
   * Case-insensitive exact match on username OR email. Stays a DAO method because
   * `lower(x) = lower(?)` across two columns is not expressible in the equality-only
   * Condition object. Mongo has no counterpart — it builds an equivalent `Filter` in the
   * adapter instead, and D4 permits that asymmetry.
   */
  async matchEmailOrUsername(term: string, options: ReadOptions = {}): Promise<UserRow[]> {
    // The OR must stay parenthesised: knex does not wrap whereRaw, so without the parens
    // `AND` would bind tighter and the guards would only apply to the email branch.
    const matched = this.table.whereRaw('(lower(username) = lower(?) OR lower(email) = lower(?))', [
      term,
      term,
    ]);

    return this.scoped(matched, options.scope).select(resolveColumns(options.fields)).all();
  }

  /**
   * The users<->usergroups join, server-side (D7). Raw SQL because PostgresTable.join only
   * does column equality and cannot express the membership relation.
   *
   * Shape matters here. The obvious form — a LATERAL subquery per user doing
   * `ug."members" @> to_jsonb(u."_id")` — is O(users x groups), and no index rescues it:
   * RLS's `tenant_id = current_setting(...)` predicate is unestimable, so the planner
   * guesses a handful of rows, takes the primary key, and filters the whole tenant's groups
   * once per user. Measured at 300 users and 5000 groups that is ~500ms, which is *slower*
   * than the JS-side join it replaced.
   *
   * Unnesting members once and aggregating by member id scans usergroups a single time and
   * hash-joins to users — O(users + groups), ~25ms on the same data, with identical results.
   *
   * RLS scopes both tables: `raw()` runs inside `withConnection`, which sets
   * `app.current_tenant`, and both `users` and `usergroups` carry a `tenant_isolation`
   * policy. The `tenant_id` correlation in the join is redundant under RLS and kept as
   * defence in depth — a cross-tenant leak here would be severe, and it costs nothing.
   */
  async findWithGroups(
    condition: Condition = {},
    options: ReadOptions = {}
  ): Promise<UserWithGroupsRow[]> {
    const columns = resolveColumns(options.fields)
      .map(column => `u."${column}"`)
      .join(', ');

    const scope = scopeSql(options.scope, 'u.');
    const filter = this.conditionSql(condition, 'u.');

    const result = await this.table.raw<{ rows: UserWithGroupsRow[] }>(
      `SELECT ${columns}, COALESCE(g.groups, '[]'::jsonb) AS groups
         FROM users u
         LEFT JOIN (
           SELECT ug."tenant_id",
                  m.member_id,
                  jsonb_agg(jsonb_build_object('_id', ug."_id", 'name', ug."name")) AS groups
             FROM usergroups ug
             CROSS JOIN LATERAL jsonb_array_elements_text(ug."members") AS m(member_id)
            WHERE jsonb_typeof(ug."members") = 'array'
            GROUP BY ug."tenant_id", m.member_id
         ) g ON g.member_id = u."_id" AND g."tenant_id" = u."tenant_id"
        WHERE ${scope.sql} AND ${filter.sql}`,
      [...scope.bindings, ...filter.bindings]
    );

    return result.rows;
  }

  /**
   * Renders the equality-only Condition into SQL. Column names are interpolated, not bound,
   * so they are checked against the known column set first — a caller-supplied key must
   * never reach the statement text.
   */
  private conditionSql(
    condition: Condition,
    prefix: string
  ): { sql: string; bindings: unknown[] } {
    const entries = Object.entries(condition);

    entries.forEach(([column]) => {
      if (!KNOWN_COLUMNS.has(column)) {
        throw new Error(`PostgresUsersDAO: unknown column "${column}" in condition`);
      }
    });

    if (!entries.length) {
      return { sql: 'TRUE', bindings: [] };
    }

    return {
      sql: entries.map(([column]) => `${prefix}"${column}" = ?`).join(' AND '),
      bindings: entries.map(([, value]) => value),
    };
  }

  async exists(condition: Condition, options: ReadOptions = {}): Promise<boolean> {
    const row = await this.scoped(this.table.where(condition), options.scope)
      .select(['_id'])
      .first();

    return Boolean(row);
  }

  async count(condition: Condition = {}, options: ReadOptions = {}): Promise<number> {
    return this.scoped(this.table.where(condition), options.scope).count();
  }

  async insertOne(row: UserRow): Promise<void> {
    await this.table.insert(row);
  }

  async updateOne(
    condition: Condition,
    changes: Condition,
    options: { scope?: UserScope } = {}
  ): Promise<void> {
    await this.scoped(this.table.where(condition), options.scope).update(changes);
  }

  /**
   * Guarded like the reads. It is a write, but the system-user guard matters most here:
   * the previous implementation guarded nothing at all.
   */
  async softDelete(ids: string[], options: { scope?: UserScope } = {}): Promise<number> {
    if (!ids.length) {
      return 0;
    }

    const updatedIds = await this.scoped(this.table.whereIn('_id', ids), options.scope).update({
      deletedAt: new Date(),
    });

    return updatedIds.length;
  }

  /* ------------------------------------------------------------------------------------
   * Legacy surface — removed in plan 05.
   *
   * These exist only so the call sites in `app/api/**` that plan 05 migrates to
   * UsersDirectory keep working meanwhile (activitylog/helpers.js, entitiesPermissions.ts,
   * userGroups.ts, users.js, the two email job handlers) — they reach both DAOs through
   * UsersDAOFactory. Plan 02 must not touch those files, and D11 requires the old path to
   * stay live until parity is proven in plan 04.
   *
   * Kept signature-compatible with MongoUsersDAO's shims, because UsersDAOFactory casts
   * between them. Do not call these from new code, and do not extend them.
   * ---------------------------------------------------------------------------------- */

  /** @deprecated use `findOne` and wrap absence in the adapter. Removed in plan 05. */
  async getById(
    id: string,
    options: { includePassword?: boolean; includeDeleted?: boolean } = {}
  ): Promise<ResultType<UserRow, UserNotFound>> {
    const row = await this.findOne(
      { _id: id },
      {
        fields: options.includePassword
          ? ['identity', 'status', 'credentials']
          : ['identity', 'status'],
        scope: { deleted: options.includeDeleted ? 'include' : 'exclude' },
      }
    );

    if (!row) {
      return Result.fail(new UserNotFound(id));
    }

    return Result.ok(row);
  }

  /** @deprecated use `findManyByIds`. Removed in plan 05. */
  async findByIds(ids: string[]): Promise<UserRow[]> {
    return this.findManyByIds(ids, { fields: ['identity', 'status'] });
  }
}

export { PostgresUsersDAO };
export type { UserWithGroupsRow, Condition };
