import { createDefaultServices } from '#V2/services/createDefaultServices.js';
import type { ThesaurusService } from '#V2/services/contracts/ThesaurusService.js';
import type { UserGroupsService } from '#V2/services/contracts/UserGroupsService.js';
import type { UsersService } from '#V2/services/contracts/UsersService.js';
import type { V2Services } from '#V2/services/types.js';

type TestServiceOverrides = {
  thesauri?: Partial<ThesaurusService>;
  users?: Partial<UsersService>;
  userGroups?: Partial<UserGroupsService>;
};

const createTestServices = (overrides?: TestServiceOverrides): V2Services => {
  const defaults = createDefaultServices();

  if (!overrides) {
    return defaults;
  }

  return {
    thesauri: { ...defaults.thesauri, ...overrides.thesauri },
    users: { ...defaults.users, ...overrides.users },
    userGroups: { ...defaults.userGroups, ...overrides.userGroups },
  };
};

export { createTestServices };
export type { TestServiceOverrides };
