import { z } from 'zod';
import { search } from '#api/search/search.js';
import { defineTool } from './Tool.js';
import { toJsonSafe } from './serialize.js';

const v1User = (ctx: { actor: { _id: string; role: string; groups: string[] } }) => ({
  _id: ctx.actor._id,
  role: ctx.actor.role,
  groups: ctx.actor.groups,
});

const searchQueryTool = defineTool({
  name: 'search_query',
  domain: 'search',
  sideEffect: 'read',
  description:
    'Search the collection (Elasticsearch). Returns matching entities with titles, templates and snippets.',
  parameters: z.object({
    searchTerm: z.string().optional(),
    types: z.array(z.string()).optional(),
    limit: z.number().int().min(1).max(50).optional(),
    from: z.number().int().min(0).optional(),
    unpublished: z.boolean().optional(),
    filters: z.record(z.unknown()).optional(),
  }),
  execute: async (args, ctx) => {
    const result = await search.search(
      {
        searchTerm: args.searchTerm,
        types: args.types,
        limit: args.limit ?? 20,
        from: args.from ?? 0,
        includeUnpublished: args.unpublished,
        filters: args.filters,
      },
      ctx.language,
      v1User(ctx)
    );

    const rows = ((result.rows as Record<string, unknown>[]) || []).map(row => ({
      sharedId: row.sharedId,
      title: row.title,
      template: row.template,
      snippets: row.snippets,
    }));

    return toJsonSafe({ totalRows: result.totalRows, rows });
  },
});

const searchSnippetsTool = defineTool({
  name: 'search_snippets',
  domain: 'search',
  sideEffect: 'read',
  description:
    'Search text snippets inside one entity (metadata and PDF full text), the same as GET /api/search_snippets.',
  parameters: z.object({
    sharedId: z.string().min(1),
    searchTerm: z.string(),
  }),
  execute: async (args, ctx) =>
    toJsonSafe(
      await search.searchSnippets(args.searchTerm, args.sharedId, ctx.language, v1User(ctx))
    ),
});

export { searchQueryTool, searchSnippetsTool };
