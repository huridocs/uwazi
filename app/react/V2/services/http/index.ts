import type { V2Services } from '../types.js';
import { httpEntitiesService } from './HttpEntitiesService.js';
import { httpRelationshipTypesService } from './HttpRelationshipTypesService.js';
import { httpRelationshipsQueryService } from './HttpRelationshipsQueryService.js';
import { httpTemplatesService } from './HttpTemplatesService.js';
import { httpThesaurusService } from './HttpThesaurusService.js';
import { httpUserGroupsService } from './HttpUserGroupsService.js';
import { httpUsersService } from './HttpUsersService.js';

const httpServices: V2Services = {
  entities: httpEntitiesService,
  thesauri: httpThesaurusService,
  templates: httpTemplatesService,
  users: httpUsersService,
  userGroups: httpUserGroupsService,
  relationshipTypes: httpRelationshipTypesService,
  relationshipsQuery: httpRelationshipsQueryService,
};

export {
  httpThesaurusService,
  httpTemplatesService,
  httpUsersService,
  httpUserGroupsService,
  httpRelationshipTypesService,
  httpRelationshipsQueryService,
  httpServices,
};
