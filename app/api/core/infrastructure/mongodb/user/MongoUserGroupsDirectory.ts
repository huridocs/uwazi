import { ObjectId } from 'mongodb';
import escapeRegExp from 'lodash/escapeRegExp.js';
import type { UserGroupsDirectory } from '#api/core/application/contracts/UserGroupsDirectory.js';
import type { UserGroupView } from '#api/core/application/contracts/UserGroupReadModels.js';
import { MongoUserGroupsDAO } from './MongoUserGroupsDAO.js';
import { MongoUserGroupsMapper } from './MongoUserGroupsMapper.js';

type Deps = {
  dao: MongoUserGroupsDAO;
};

const isGroupId = (id: string): boolean => /^[0-9a-fA-F]{24}$/.test(id);

const VIEW_PROJECTION = { _id: 1, name: 1 };

class MongoUserGroupsDirectory implements UserGroupsDirectory {
  private dao: MongoUserGroupsDAO;

  constructor(deps: Deps) {
    this.dao = deps.dao;
  }

  async getManyByIds(ids: string[]): Promise<UserGroupView[]> {
    if (!ids.length) {
      return [];
    }

    const objectIds = ids.filter(isGroupId).map(id => ObjectId.createFromHexString(id));

    const groups = await this.dao.find(
      { _id: { $in: objectIds } },
      { projection: VIEW_PROJECTION }
    );

    return groups.map(group => MongoUserGroupsMapper.toView(group));
  }

  async searchByName(term: string): Promise<UserGroupView[]> {
    const groups = await this.dao.find(
      { name: new RegExp(`^${escapeRegExp(term)}`, 'i') },
      { projection: VIEW_PROJECTION }
    );

    return groups.map(group => MongoUserGroupsMapper.toView(group));
  }

  async list(): Promise<UserGroupView[]> {
    const groups = await this.dao.find({}, { projection: VIEW_PROJECTION });

    return groups.map(group => MongoUserGroupsMapper.toView(group));
  }
}

export { MongoUserGroupsDirectory };
