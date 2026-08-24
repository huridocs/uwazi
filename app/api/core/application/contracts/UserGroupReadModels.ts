import { UserRole } from '#api/core/domain/user/User.js';

type UserGroupView = {
  _id: string;
  name: string;
};

type UserGroupMemberView = {
  refId: string;
  username?: string;
  role?: UserRole;
  email?: string;
};

type UserGroupWithMembers = UserGroupView & {
  members: UserGroupMemberView[];
};

export type { UserGroupView, UserGroupMemberView, UserGroupWithMembers };
