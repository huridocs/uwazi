import { createHttpThesaurusService } from './http/HttpThesaurusService.js';
import { createHttpUserGroupsService } from './http/HttpUserGroupsService.js';
import { createHttpUsersService } from './http/HttpUsersService.js';
import type { V2Services } from './types.js';

const createDefaultServices = (): V2Services => ({
  thesauri: createHttpThesaurusService(),
  users: createHttpUsersService(),
  userGroups: createHttpUserGroupsService(),
});

export { createDefaultServices };
