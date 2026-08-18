/* eslint-disable class-methods-use-this */
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

const KNOWN_COLUMNS = new Set<string>(Object.values(COLUMNS_BY_GROUP).flat());

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

  async findManyByIds(ids: string[], options: ReadOptions = {}): Promise<UserRow[]> {
    if (!ids.length) {
      return [];
    }

    return this.scoped(this.table.whereIn('_id', ids), options.scope)
      .select(resolveColumns(options.fields))
      .all();
  }

  async matchEmailOrUsername(term: string, options: ReadOptions = {}): Promise<UserRow[]> {
    const matched = this.table.whereRaw('(lower(username) = lower(?) OR lower(email) = lower(?))', [
      term,
      term,
    ]);

    return this.scoped(matched, options.scope).select(resolveColumns(options.fields)).all();
  }

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
    return result.rows.map(row => PostgresUsersDAO.withoutNulls(row));
  }

  private static withoutNulls(row: UserWithGroupsRow): UserWithGroupsRow {
    return Object.fromEntries(
      Object.entries(row).filter(([, value]) => value !== null)
    ) as UserWithGroupsRow;
  }

  private conditionSql(condition: Condition, prefix: string): { sql: string; bindings: unknown[] } {
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

  async countByRole(options: { scope?: UserScope } = {}): Promise<Record<string, number>> {
    const scope = scopeSql(options.scope);

    const result = await this.table.raw<{ rows: { role: string; count: string }[] }>(
      `SELECT "role", count(*) AS count
         FROM users
        WHERE ${scope.sql}
        GROUP BY "role"`,
      scope.bindings
    );

    return Object.fromEntries(result.rows.map(row => [row.role, Number(row.count)]));
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

  async delete(ids: string[], options: { scope?: UserScope } = {}): Promise<number> {
    if (!ids.length) {
      return 0;
    }

    const updatedIds = await this.scoped(this.table.whereIn('_id', ids), options.scope).update({
      deletedAt: new Date(),
    });

    return updatedIds.length;
  }
}

export { PostgresUsersDAO };
export type { UserWithGroupsRow, Condition };
