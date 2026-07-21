import { httpServices } from '#V2/services/http/index.js';
import type { EntitiesService } from '#V2/services/contracts/EntitiesService.js';
import type { ThesaurusService } from '#V2/services/contracts/ThesaurusService.js';
import type { UserGroupsService } from '#V2/services/contracts/UserGroupsService.js';
import type { UsersService } from '#V2/services/contracts/UsersService.js';
import type { V2Services } from '#V2/services/types.js';

type TestServiceOverrides = {
  entities?: Partial<EntitiesService>;
  thesauri?: Partial<ThesaurusService>;
  users?: Partial<UsersService>;
  userGroups?: Partial<UserGroupsService>;
};

const createTestServices = (overrides?: TestServiceOverrides): V2Services => {
  const defaults = httpServices;

  if (!overrides) {
    return defaults;
  }

  return {
    entities: { ...defaults.entities, ...overrides.entities },
    thesauri: { ...defaults.thesauri, ...overrides.thesauri },
    users: { ...defaults.users, ...overrides.users },
    userGroups: { ...defaults.userGroups, ...overrides.userGroups },
  };
};

export { createTestServices };
export type { TestServiceOverrides };
