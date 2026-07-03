import type { ThesaurusService } from './contracts/ThesaurusService.js';
import type { UserGroupsService } from './contracts/UserGroupsService.js';
import type { UsersService } from './contracts/UsersService.js';

interface V2Services {
  thesauri: ThesaurusService;
  users: UsersService;
  userGroups: UserGroupsService;
}

export type { V2Services };
