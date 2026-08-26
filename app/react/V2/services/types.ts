import type { EntitiesService } from './contracts/EntitiesService.js';
import type { RelationshipTypesService } from './contracts/RelationshipTypesService.js';
import type { SearchService } from './contracts/SearchService.js';
import type { TemplatesService } from './contracts/TemplatesService.js';
import type { ThesaurusService } from './contracts/ThesaurusService.js';
import type { UserGroupsService } from './contracts/UserGroupsService.js';
import type { UsersService } from './contracts/UsersService.js';

interface V2Services {
  entities: EntitiesService;
  thesauri: ThesaurusService;
  templates: TemplatesService;
  users: UsersService;
  userGroups: UserGroupsService;
  relationshipTypes: RelationshipTypesService;
  search: SearchService;
}

export type { V2Services };
