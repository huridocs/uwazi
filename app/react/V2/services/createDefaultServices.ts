import { createThesaurusService } from './thesauri/ThesaurusService.js';
import { createUsersService } from './users/UsersService.js';
import type { V2Services } from './types.js';

const createDefaultServices = (): V2Services => ({
  thesauri: createThesaurusService(),
  users: createUsersService(),
});

export { createDefaultServices };
