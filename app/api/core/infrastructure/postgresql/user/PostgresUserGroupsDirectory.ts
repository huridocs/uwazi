import type { UserGroupsDirectory } from '#api/core/application/contracts/UserGroupsDirectory.js';
import type { UserGroupView } from '#api/core/application/contracts/UserGroupReadModels.js';
import { PostgresUserGroupsDAO } from './PostgresUserGroupsDAO.js';
import { PostgresUserGroupsMapper } from './PostgresUserGroupsMapper.js';

type Deps = {
  dao: PostgresUserGroupsDAO;
};

const VIEW_COLUMNS = ['_id', 'name'];

class PostgresUserGroupsDirectory implements UserGroupsDirectory {
  private dao: PostgresUserGroupsDAO;

  constructor(deps: Deps) {
    this.dao = deps.dao;
  }

  async getManyByIds(ids: string[]): Promise<UserGroupView[]> {
    if (!ids.length) {
      return [];
    }

    const rows = await this.dao.table.whereIn('_id', ids).select(VIEW_COLUMNS).all();

    return rows.map(row => PostgresUserGroupsMapper.toView(row));
  }

  async searchByName(term: string): Promise<UserGroupView[]> {
    const prefix = `${term.replace(/[\\%_]/g, character => `\\${character}`)}%`;
    const rows = await this.dao.table.whereRaw('name ILIKE ?', [prefix]).select(VIEW_COLUMNS).all();

    return rows.map(row => PostgresUserGroupsMapper.toView(row));
  }

  async list(): Promise<UserGroupView[]> {
    const rows = await this.dao.table.select(VIEW_COLUMNS).all();

    return rows.map(row => PostgresUserGroupsMapper.toView(row));
  }
}

export { PostgresUserGroupsDirectory };
