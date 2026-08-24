import { PostgresDataSource, PostgresDataSourceDeps } from '../common/PostgresDataSource.js';
import type { PostgresTable } from '../common/PostgresTable.js';
import type { UserGroupRow } from './PostgresUserGroupRow.js';

/**
 * A generic building block over the usergroups table: the tenant-scoped, transaction-aware
 * query builder and row typing, nothing else. It returns rows and knows no read model.
 *
 * There are no intent-named methods here on purpose — user groups have no guard to enforce, so
 * a read vocabulary would be an abstraction expressing nothing. If one ever appears, the
 * `table` accessor is overridden here and every read inherits it.
 *
 * Query construction lives one level up, in PostgresUserGroupsDirectory and
 * PostgresUserGroupsQueryService. Exposing the builder is safe: PostgresTable chains
 * immutably, cloning on every call, so callers cannot corrupt each other's queries.
 */
class PostgresUserGroupsDAO extends PostgresDataSource<UserGroupRow> {
  constructor(deps: PostgresDataSourceDeps) {
    super('usergroups', deps);
  }

  public get table(): PostgresTable<UserGroupRow> {
    return super.table;
  }
}

export { PostgresUserGroupsDAO };
