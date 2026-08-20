import type { UserGroupView } from './UserGroupReadModels.js';

interface UserGroupsDirectory {
  getManyByIds(ids: string[]): Promise<UserGroupView[]>;
  searchByName(term: string): Promise<UserGroupView[]>;
  list(): Promise<UserGroupView[]>;
}

export type { UserGroupsDirectory };
