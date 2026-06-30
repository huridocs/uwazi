import type { ThesaurusService } from './thesauri/ThesaurusService.js';
import type { UsersService } from './users/UsersService.js';

interface V2Services {
  thesauri: ThesaurusService;
  users: UsersService;
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type { V2Services, DeepPartial };
