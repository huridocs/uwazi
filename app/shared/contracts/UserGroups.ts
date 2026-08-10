type GroupSummary = {
  _id: string;
  name: string;
};

type GroupMember = {
  refId: string;
  username: string;
  role?: string;
  email?: string;
};

type UserGroup = {
  _id?: string;
  name: string;
  members: GroupMember[];
};

type UnenrichedUserGroup = { _id: string; name: string; members: { refId: string }[] };

type CreateUserGroupRequest = { name: string; members: { refId: string }[] };

type CreateUserGroupResponse = UnenrichedUserGroup;

type UpdateUserGroupRequest = { _id: string; name: string; members: { refId: string }[] };

type UpdateUserGroupResponse = UnenrichedUserGroup;

type DeleteUserGroupsRequest = string[];

type DeleteUserGroupsResponse = boolean;

type EnrichedGroupMember = { refId: string; username?: string; role?: string; email?: string };
type EnrichedUserGroup = { _id: string; name: string; members: EnrichedGroupMember[] };

type GetUserGroupsResponse = EnrichedUserGroup[];

export type {
  GroupSummary,
  GroupMember,
  UserGroup,
  CreateUserGroupRequest,
  CreateUserGroupResponse,
  UpdateUserGroupRequest,
  UpdateUserGroupResponse,
  DeleteUserGroupsRequest,
  DeleteUserGroupsResponse,
  GetUserGroupsResponse,
};
