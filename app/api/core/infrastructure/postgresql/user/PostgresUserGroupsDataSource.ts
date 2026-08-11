import { User } from '#api/core/domain/user/User.js';
import { UserGroup } from '#api/core/domain/userGroup/UserGroup.js';
import { UserGroupNameExists } from '#api/core/domain/userGroup/errors.js';
import { IdGenerator } from '#api/core/application/contracts/IdGenerator.js';
import {
  UserGroupsDataSource,
  CreateUserGroupParams,
  UpdateUserGroupParams,
} from '#api/core/application/contracts/UserGroupsDataSource.js';
import { Result } from '#api/core/libs/Result.js';
import type { ResultType } from '#api/core/libs/Result.js';
import { PostgresDataSource, PostgresDataSourceDeps } from '../common/PostgresDataSource.js';
import { PostgresUserGroupsMapper } from './PostgresUserGroupsMapper.js';
import type { UserGroupRow } from './PostgresUserGroupRow.js';

type Deps = PostgresDataSourceDeps & { idGenerator: IdGenerator };

const placeholders = (values: unknown[]) => values.map(() => '?').join(', ');

class PostgresUserGroupsDataSource
  extends PostgresDataSource<UserGroupRow>
  implements UserGroupsDataSource
{
  private idGenerator: IdGenerator;

  constructor(deps: Deps) {
    super('usergroups', deps);
    this.idGenerator = deps.idGenerator;
  }

  async updateUserGroups(user: User): Promise<void> {
    const targetGroupIds = user.groups.map(group => group._id);

    if (targetGroupIds.length > 0) {
      await this.table.raw(
        `UPDATE ?? SET members = (
           SELECT COALESCE(jsonb_agg(DISTINCT v), '[]'::jsonb)
           FROM jsonb_array_elements_text(members || to_jsonb(?::text)) v
         )
         WHERE "_id" IN (${placeholders(targetGroupIds)})`,
        [this.table.tableName, user._id, ...targetGroupIds]
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
      [this.table.tableName, user._id, ...targetGroupIds, user._id]
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

  async getUserGroups(user: User): Promise<User['groups']> {
    const rows = await this.table.whereRaw('members @> to_jsonb(?::text)', [user._id]).all();
    return rows.map(row => ({ _id: row._id, name: row.name }));
  }

  async create({ name, memberIds }: CreateUserGroupParams): Promise<UserGroup> {
    const id = this.idGenerator.generate();
    await this.table.insert(PostgresUserGroupsMapper.toRow(id, name, memberIds));
    return new UserGroup(id, name, memberIds);
  }

  async update({ id, name, memberIds }: UpdateUserGroupParams): Promise<UserGroup> {
    await this.table.where({ _id: id }).update({ name, members: memberIds });
    return new UserGroup(id, name, memberIds);
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
