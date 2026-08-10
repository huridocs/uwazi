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

/** Create/update responses aren't member-enriched (mirrors legacy save()'s response). */
type UnenrichedUserGroup = { _id: string; name: string; members: { refId: string }[] };

type CreateUserGroupRequest = { name: string; members: { refId: string }[] };

type CreateUserGroupResponse = UnenrichedUserGroup;

type UpdateUserGroupRequest = { _id: string; name: string; members: { refId: string }[] };

type UpdateUserGroupResponse = UnenrichedUserGroup;

type DeleteUserGroupsRequest = string[];

type DeleteUserGroupsResponse = boolean;

/**
 * username/role/email are absent when a member's refId no longer resolves to a live
 * user (e.g. the user was deleted without going through group cleanup) — unlike
 * GroupMember, which callers rely on always having a username (populated from a user
 * picker on write, never persisted/read back unhydrated).
 */
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
