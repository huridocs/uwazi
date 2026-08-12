/* eslint-disable class-methods-use-this */
import { PUBLIC_USER_ID } from '#api/core/domain/user/User.js';
import { UserNotFound } from '#api/core/domain/user/errors.js';
import { Result } from '#api/core/libs/Result.js';
import type { ResultType } from '#api/core/libs/Result.js';
import { PostgresDataSource, PostgresDataSourceDeps } from '../common/PostgresDataSource.js';
import { PostgresTable } from '../common/PostgresTable.js';
import type { UserRow } from './PostgresUserRow.js';

const PUBLIC_USER_ID_STRING = PUBLIC_USER_ID.toHexString();

const EXCLUDE_PUBLIC_USER_KEY = '__excludePublicUser';

// getById's default column set: excludes accountLocked too (no current caller needs it there).
const GETBYID_SAFE_COLUMNS: (keyof UserRow)[] = [
  '_id',
  'username',
  'email',
  'role',
  'using2fa',
  'deletedAt',
];

// findMany/findByIds' default column set: accountLocked is a status flag consumed by
// listWithGroups for the user-management UI, not credential data — only the true
// credential fields are excluded here.
const LIST_SAFE_COLUMNS: (keyof UserRow)[] = [
  '_id',
  'username',
  'email',
  'role',
  'using2fa',
  'accountLocked',
  'deletedAt',
];

type Condition = Record<string, unknown>;
type QueryOptions = { includeDeleted?: boolean; columns?: (keyof UserRow)[] };

type GetByIdOptions = QueryOptions & {
  includePassword?: boolean;
  includeSecret?: boolean;
  includeFailedLogins?: boolean;
  includeAccountUnlockCode?: boolean;
  includeAccountLocked?: boolean;
};

class PostgresUsersDAO extends PostgresDataSource<UserRow> {
  constructor(deps: PostgresDataSourceDeps) {
    super('users', deps);
  }

  private notDeleted(table: PostgresTable<UserRow>): PostgresTable<UserRow> {
    return table.whereNull('deletedAt');
  }

  private notPublicUser(table: PostgresTable<UserRow>): PostgresTable<UserRow> {
    return table.whereNot('_id', PUBLIC_USER_ID_STRING);
  }

  private applyCondition(condition: Condition): PostgresTable<UserRow> {
    const { [EXCLUDE_PUBLIC_USER_KEY]: excludePublicUser, ...rest } = condition;
    const query = this.table.where(rest);
    return excludePublicUser ? this.notPublicUser(query) : query;
  }

  notPublicUserFilter(): Condition {
    return { [EXCLUDE_PUBLIC_USER_KEY]: true };
  }

  async findOne(condition: Condition, options: QueryOptions = {}): Promise<UserRow | undefined> {
    const query = this.applyCondition(condition);
    const filtered = options.includeDeleted ? query : this.notDeleted(query);
    return (options.columns ? filtered.select(options.columns) : filtered).first();
  }

  async exists(condition: Condition): Promise<boolean> {
    const row = await this.notPublicUser(this.notDeleted(this.applyCondition(condition))).first();
    return Boolean(row);
  }

  async count(condition: Condition = {}): Promise<number> {
    return this.notDeleted(this.applyCondition(condition)).count();
  }

  async updateOne(
    condition: Condition,
    changes: Condition,
    options: QueryOptions = {}
  ): Promise<void> {
    const query = this.applyCondition(condition);
    await (options.includeDeleted ? query : this.notDeleted(query)).update(changes);
  }

  async insertOne(row: UserRow): Promise<void> {
    await this.table.insert(row);
  }

  async softDelete(ids: string[]): Promise<number> {
    if (!ids.length) {
      return 0;
    }

    const updatedIds = await this.table.whereIn('_id', ids).update({ deletedAt: new Date() });
    return updatedIds.length;
  }

  async getById(
    id: string,
    options: GetByIdOptions = {}
  ): Promise<ResultType<UserRow, UserNotFound>> {
    const columns = [...GETBYID_SAFE_COLUMNS];
    if (options.includePassword) columns.push('password');
    if (options.includeSecret) columns.push('secret');
    if (options.includeFailedLogins) columns.push('failedLogins');
    if (options.includeAccountUnlockCode) columns.push('accountUnlockCode');
    if (options.includeAccountLocked) columns.push('accountLocked');

    const row = await this.findOne(
      { _id: id },
      { includeDeleted: options.includeDeleted, columns }
    );

    if (!row) {
      return Result.fail(new UserNotFound(id));
    }

    return Result.ok(row);
  }

  async findMany(condition: Condition = {}, options: QueryOptions = {}): Promise<UserRow[]> {
    const query = this.applyCondition(condition);
    const filtered = options.includeDeleted ? query : this.notDeleted(query);
    return filtered.select(options.columns ?? LIST_SAFE_COLUMNS).all();
  }

  async findByIds(ids: string[], options: QueryOptions = {}): Promise<UserRow[]> {
    if (!ids.length) {
      return [];
    }

    const query = this.notPublicUser(this.table.whereIn('_id', ids));
    const filtered = options.includeDeleted ? query : this.notDeleted(query);
    return filtered.select(options.columns ?? LIST_SAFE_COLUMNS).all();
  }

  /**
   * Generic primitive: case-insensitive exact match on username OR email, guarded +
   * safe-columns. Not expressible via findMany's equality-only Condition (needs raw SQL
   * OR + lower()), so it stays a DAO-level method; the read-shape/semantics documentation
   * for "search collaborators by term" lives in PostgresUsersQueryService.findByEmailOrUsername,
   * which is a thin pass-through to this.
   */
  async matchEmailOrUsername(term: string): Promise<UserRow[]> {
    const query = this.notPublicUser(
      this.notDeleted(
        this.table.whereRaw('lower(username) = lower(?) OR lower(email) = lower(?)', [
          term,
          term,
        ])
      )
    ).select(LIST_SAFE_COLUMNS);

    return query.all();
  }
}

export { PostgresUsersDAO };
