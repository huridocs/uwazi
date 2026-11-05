import { z } from 'zod';
import { CreateRelationshipTypeUseCaseFactory } from '#api/core/infrastructure/factories/CreateRelationshipTypeUseCaseFactory.js';
import { DeleteRelationshipTypeUseCaseFactory } from '#api/core/infrastructure/factories/DeleteRelationshipTypeUseCaseFactory.js';
import { GetRelationshipTypesUseCaseFactory } from '#api/core/infrastructure/factories/GetRelationshipTypesUseCaseFactory.js';
import { UpdateRelationshipTypeUseCaseFactory } from '#api/core/infrastructure/factories/UpdateRelationshipTypeUseCaseFactory.js';
import { defineTool } from './Tool.js';
import { toJsonSafe } from './serialize.js';

const asDto = (item: { id: string; name: string }) => ({ _id: item.id, name: item.name });

const relationTypesListTool = defineTool({
  name: 'relation_types_list',
  domain: 'relationTypes',
  sideEffect: 'read',
  description: 'List relationship types.',
  parameters: z.object({
    id: z.string().optional(),
  }),
  execute: async args => {
    const rows = await GetRelationshipTypesUseCaseFactory.default().execute({ id: args.id });
    return toJsonSafe({ rows: rows.map(asDto) });
  },
});

const relationTypesCreateTool = defineTool({
  name: 'relation_types_create',
  domain: 'relationTypes',
  sideEffect: 'write',
  adminOnly: true,
  description: 'Create a relationship type. Admin only.',
  parameters: z.object({
    name: z.string().min(1),
  }),
  execute: async args =>
    toJsonSafe(asDto(await CreateRelationshipTypeUseCaseFactory.default().execute(args))),
});

const relationTypesUpdateTool = defineTool({
  name: 'relation_types_update',
  domain: 'relationTypes',
  sideEffect: 'write',
  adminOnly: true,
  description: 'Rename a relationship type. Admin only.',
  parameters: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
  }),
  execute: async args =>
    toJsonSafe(asDto(await UpdateRelationshipTypeUseCaseFactory.default().execute(args))),
});

const relationTypesDeleteTool = defineTool({
  name: 'relation_types_delete',
  domain: 'relationTypes',
  sideEffect: 'write',
  adminOnly: true,
  description: 'Delete a relationship type. Admin only.',
  parameters: z.object({
    id: z.string().min(1),
  }),
  execute: async args =>
    toJsonSafe(await DeleteRelationshipTypeUseCaseFactory.default().execute(args)),
});

export {
  relationTypesCreateTool,
  relationTypesDeleteTool,
  relationTypesListTool,
  relationTypesUpdateTool,
};
