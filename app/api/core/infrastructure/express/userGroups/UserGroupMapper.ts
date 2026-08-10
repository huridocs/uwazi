import { UserGroupWithMembers } from '#api/core/application/contracts/UserGroupsDataSource.js';
import { UserGroup } from '#api/core/domain/userGroup/UserGroup.js';

type UserGroupDTO = UserGroupWithMembers;

const toDTO = (group: UserGroupWithMembers): UserGroupDTO => group;

const toUpsertDTO = (group: UserGroup): UserGroupDTO => ({
  _id: group.id,
  name: group.name,
  members: group.memberIds.map(refId => ({ refId })),
});

export { toDTO, toUpsertDTO };
export type { UserGroupDTO };
