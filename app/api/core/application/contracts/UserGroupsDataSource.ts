import { User } from '#api/core/domain/user/User.js';
import { UserGroup } from '#api/core/domain/userGroup/UserGroup.js';

type UserGroupMember = { refId: string; username: string; role: string; email: string };
type UserGroupWithMembers = { _id: string; name: string; members: UserGroupMember[] };

interface UserGroupsDataSource {
  updateUserGroups(user: User): Promise<void>;
  getUserGroups(user: User): Promise<User['groups']>;
  removeUsersFromGroups(userIds: string[]): Promise<void>;
  create(name: string, memberIds: string[]): Promise<UserGroup>;
  update(id: string, name: string, memberIds: string[]): Promise<UserGroup>;
  delete(ids: string[]): Promise<void>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  getAll(): Promise<UserGroupWithMembers[]>;
}

export type { UserGroupsDataSource, UserGroupMember, UserGroupWithMembers };
