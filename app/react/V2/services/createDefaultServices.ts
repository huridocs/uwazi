import { createHttpThesaurusService } from './http/HttpThesaurusService.js';
import { createHttpUsersService } from './http/HttpUsersService.js';
import type { V2Services } from './types.js';

const createDefaultServices = (): V2Services => ({
  thesauri: createHttpThesaurusService(),
  users: createHttpUsersService(),
});

export { createDefaultServices };
