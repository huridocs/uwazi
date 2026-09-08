import type { Request as ExpressRequest } from 'express';
import type { UserSchema } from '#shared/types/userType.js';
import { httpServices } from '../http/index.js';
import type { V2Services } from '../types.js';
import { createServerRelationshipTypesService } from './ServerRelationshipTypesService.js';
import { createServerSearchService } from './ServerSearchService.js';
import { createServerTemplatesService } from './ServerTemplatesService.js';
import { createServerThesaurusService } from './ServerThesaurusService.js';
import { createServerUserGroupsService } from './ServerUserGroupsService.js';
import { createServerUsersService } from './ServerUsersService.js';
import type { ServerServiceContext } from './types.js';

const buildContextFromRequest = (req: ExpressRequest): ServerServiceContext => {
  const { connection, ...headers } = req.headers;
  return {
    user: req.user as UserSchema | undefined,
    headers,
    language: req.language,
  };
};

const createServerServices = (req: ExpressRequest): V2Services => {
  const ctx = buildContextFromRequest(req);
  return {
    ...httpServices,
    thesauri: createServerThesaurusService(ctx),
    templates: createServerTemplatesService(ctx),
    users: createServerUsersService(ctx),
    userGroups: createServerUserGroupsService(ctx),
    relationshipTypes: createServerRelationshipTypesService(ctx),
    search: createServerSearchService(ctx),
  };
};

export { createServerServices, buildContextFromRequest };
