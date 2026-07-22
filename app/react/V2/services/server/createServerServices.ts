import type { Request as ExpressRequest } from 'express';
import type { UserSchema } from '#shared/types/userType.js';
import { httpServices } from '../http/index.js';
import type { V2Services } from '../types.js';
import { createServerThesaurusService } from './ServerThesaurusService.js';
import { createServerUserGroupsService } from './ServerUserGroupsService.js';
import { createServerUsersService } from './ServerUsersService.js';
import type { ServerServiceContext } from './types.js';

const buildContextFromRequest = (req: ExpressRequest): ServerServiceContext => {
  const { connection, ...headers } = req.headers;
  return {
    user: req.user as UserSchema | undefined,
    headers,
  };
};

const createServerServices = (req: ExpressRequest): V2Services => {
  const ctx = buildContextFromRequest(req);
  return {
    ...httpServices,
    thesauri: createServerThesaurusService(ctx),
    users: createServerUsersService(ctx),
    userGroups: createServerUserGroupsService(ctx),
  };
};

export { createServerServices, buildContextFromRequest };
