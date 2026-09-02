import { UserGroup } from '#api/core/domain/userGroup/UserGroup.js';
import { UserGroupNameExists, UserGroupNotFound } from '#api/core/domain/userGroup/errors.js';
import { UserGroupsDataSource } from '#api/core/application/contracts/UserGroupsDataSource.js';
import { Result } from '#api/core/libs/Result.js';
import type { ResultType } from '#api/core/libs/Result.js';
import { PostgresDataSource, PostgresDataSourceDeps } from '../common/PostgresDataSource.js';
import { PostgresUserGroupsMapper } from './PostgresUserGroupsMapper.js';
import type { UserGroupRow } from './PostgresUserGroupRow.js';

const placeholders = (values: unknown[]) => values.map(() => '?').join(', ');

class PostgresUserGroupsDataSource
  extends PostgresDataSource<UserGroupRow>
  implements UserGroupsDataSource
{
  constructor(deps: PostgresDataSourceDeps) {
    super('usergroups', deps);
  }

  async assignGroupsToUser(userId: string, groupIds: string[]): Promise<void> {
    const targetGroupIds = groupIds;
    if (targetGroupIds.length > 0) {
      await this.table.raw(
        `UPDATE ?? SET members = (
           SELECT COALESCE(jsonb_agg(DISTINCT v), '[]'::jsonb)
           FROM jsonb_array_elements_text(members || to_jsonb(?::text)) v
         )
         WHERE "_id" IN (${placeholders(targetGroupIds)})`,
        [this.table.tableName, userId, ...targetGroupIds]
      );
    }

    const excludeTargets = targetGroupIds.length
      ? `WHERE "_id" NOT IN (${placeholders(targetGroupIds)})`
      : 'WHERE true';

    await this.table.raw(
      `UPDATE ?? SET members = (
         SELECT COALESCE(jsonb_agg(v), '[]'::jsonb)
         FROM jsonb_array_elements_text(members) v
         WHERE v != ?
       )
       ${excludeTargets} AND members @> to_jsonb(?::text)`,
      [this.table.tableName, userId, ...targetGroupIds, userId]
    );
  }

  async removeUsersFromGroups(userIds: string[]): Promise<void> {
    if (!userIds.length) return;

    await this.table.raw(
      `UPDATE ?? SET members = (
         SELECT COALESCE(jsonb_agg(v), '[]'::jsonb)
         FROM jsonb_array_elements_text(members) v
         WHERE v NOT IN (${placeholders(userIds)})
       )`,
      [this.table.tableName, ...userIds]
    );
  }

  async findById(id: string): Promise<ResultType<UserGroup, UserGroupNotFound>> {
    const row = await this.table.where({ _id: id }).first();
    return row
      ? Result.ok(PostgresUserGroupsMapper.toDomain(row))
      : Result.fail(new UserGroupNotFound(id));
  }

  async create(userGroup: UserGroup): Promise<UserGroup> {
    await this.table.insert(
      PostgresUserGroupsMapper.toRow(userGroup.id, userGroup.name, userGroup.memberIds)
    );
    return userGroup;
  }

  async update(userGroup: UserGroup): Promise<UserGroup> {
    await this.table
      .where({ _id: userGroup.id })
      .update({ name: userGroup.name, members: userGroup.memberIds });
    return userGroup;
  }

  async delete(ids: string[]): Promise<void> {
    if (!ids.length) return;
    await this.table.whereIn('_id', ids).delete();
  }

  async checkUniqueName(
    name: string,
    excludeId?: string
  ): Promise<ResultType<true, UserGroupNameExists>> {
    let query = this.table.whereRaw('"name" ILIKE ?', [name]);
    if (excludeId) {
      query = query.whereNot('_id', excludeId);
    }

    const count = await query.count();

    if (count > 0) {
      return Result.fail(new UserGroupNameExists(name));
    }

    return Result.ok(true);
  }
}

export { PostgresUserGroupsDataSource };
