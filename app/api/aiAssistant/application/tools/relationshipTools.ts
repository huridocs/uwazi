import { z } from 'zod';
import relationships from '#api/relationships/relationships.js';
import { RelationshipsQueryServiceFactory } from '#api/relationships/query/factory/RelationshipsQueryServiceFactory.js';
import { defineTool } from './Tool.js';
import { toJsonSafe } from './serialize.js';

const relationshipsListTool = defineTool({
  name: 'relationships_list',
  domain: 'relationships',
  sideEffect: 'read',
  description: 'List relationship hubs for an entity (summary). Empty if the user cannot see it.',
  parameters: z.object({
    sharedId: z.string().min(1),
  }),
  execute: async (args, ctx) => {
    const rows = await RelationshipsQueryServiceFactory.default().getSummary({
      sharedId: args.sharedId,
      language: ctx.language,
    });
    return toJsonSafe({ rows });
  },
});

const relationshipsSaveTool = defineTool({
  name: 'relationships_save',
  domain: 'relationships',
  sideEffect: 'write',
  description:
    'Create or delete relationships in bulk, the same as POST /api/relationships/bulk. Pass save and/or delete arrays.',
  parameters: z.object({
    save: z.array(z.record(z.unknown())).optional(),
    delete: z.array(z.object({ _id: z.string().min(1) })).optional(),
  }),
  execute: async (args, ctx) =>
    toJsonSafe(
      await relationships.bulk({ save: args.save ?? [], delete: args.delete ?? [] }, ctx.language)
    ),
});

export { relationshipsListTool, relationshipsSaveTool };
