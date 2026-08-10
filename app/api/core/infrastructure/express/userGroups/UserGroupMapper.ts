import { UserGroupWithMembers } from '#api/core/application/contracts/UserGroupsDataSource.js';
import { UserGroup } from '#api/core/domain/userGroup/UserGroup.js';

type UserGroupDTO = UserGroupWithMembers;

const toDTO = (group: UserGroupWithMembers): UserGroupDTO => group;

/**
 * Create/update responses aren't member-enriched (mirrors legacy save()'s response,
 * which persists and returns members as bare {refId} — enrichment only happens on
 * getAll()).
 */
const toUpsertDTO = (group: UserGroup): UserGroupDTO => ({
  _id: group.id,
  name: group.name,
  members: group.memberIds.map(refId => ({ refId })),
});

export { toDTO, toUpsertDTO };
export type { UserGroupDTO };
