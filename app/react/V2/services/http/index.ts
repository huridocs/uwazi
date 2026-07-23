import type { V2Services } from '../types.js';
import { httpEntitiesService } from './HttpEntitiesService.js';
import { httpRelationshipTypesService } from './HttpRelationshipTypesService.js';
import { httpThesaurusService } from './HttpThesaurusService.js';
import { httpUserGroupsService } from './HttpUserGroupsService.js';
import { httpUsersService } from './HttpUsersService.js';

const httpServices: V2Services = {
  entities: httpEntitiesService,
  thesauri: httpThesaurusService,
  users: httpUsersService,
  userGroups: httpUserGroupsService,
  relationshipTypes: httpRelationshipTypesService,
};

export {
  httpThesaurusService,
  httpUsersService,
  httpUserGroupsService,
  httpRelationshipTypesService,
  httpServices,
};
