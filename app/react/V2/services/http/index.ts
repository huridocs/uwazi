import type { V2Services } from '../types.js';
import { httpThesaurusService } from './HttpThesaurusService.js';
import { httpUserGroupsService } from './HttpUserGroupsService.js';
import { httpUsersService } from './HttpUsersService.js';

const httpServices: V2Services = {
  thesauri: httpThesaurusService,
  users: httpUsersService,
  userGroups: httpUserGroupsService,
};

export {
  httpThesaurusService,
  httpUsersService,
  httpUserGroupsService,
  httpServices,
};
