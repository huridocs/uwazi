import type { UserGroupWithMembers } from './UserGroupReadModels.js';

interface UserGroupsQueryService {
  listUserGroups(): Promise<UserGroupWithMembers[]>;
}

export type { UserGroupsQueryService };
