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

type Condition = Record<string, unknown>;
type QueryOptions = { includeDeleted?: boolean };

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
    return (options.includeDeleted ? query : this.notDeleted(query)).first();
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
    options: QueryOptions = {}
  ): Promise<ResultType<UserRow, UserNotFound>> {
    const row = await this.findOne({ _id: id }, options);

    if (!row) {
      return Result.fail(new UserNotFound(id));
    }

    return Result.ok(row);
  }

  async findMany(condition: Condition = {}, options: QueryOptions = {}): Promise<UserRow[]> {
    const query = this.applyCondition(condition);
    return (options.includeDeleted ? query : this.notDeleted(query)).all();
  }

  async findByIds(ids: string[], options: QueryOptions = {}): Promise<UserRow[]> {
    if (!ids.length) {
      return [];
    }

    const query = this.notPublicUser(this.table.whereIn('_id', ids));
    return (options.includeDeleted ? query : this.notDeleted(query)).all();
  }
}

export { PostgresUsersDAO };
