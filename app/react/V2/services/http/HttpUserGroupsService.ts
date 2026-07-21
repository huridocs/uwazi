import * as usersApi from '#V2/api/users/index.js';
import type { UserGroupsService } from '../contracts/UserGroupsService.js';

const httpUserGroupsService: UserGroupsService = {
  getAll: async ({ headers } = {}) => usersApi.getUserGroups(headers),
  upsert: async (group, { headers } = {}) => usersApi.saveGroup(group, headers),
  delete: async (groups, { headers } = {}) => usersApi.deleteGroup(groups, headers),
};

export { httpUserGroupsService };
