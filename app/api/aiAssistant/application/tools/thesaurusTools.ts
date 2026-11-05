import { z } from 'zod';
import { CreateThesaurusUseCaseFactory } from '#api/core/infrastructure/factories/CreateThesaurusUseCaseFactory.js';
import { DeleteThesaurusUseCaseFactory } from '#api/core/infrastructure/factories/DeleteThesaurusUseCaseFactory.js';
import { ThesauriDAOFactory } from '#api/core/infrastructure/factories/ThesauriDAOFactory.js';
import { UpdateThesaurusUseCaseFactory } from '#api/core/infrastructure/factories/UpdateThesaurusUseCaseFactory.js';
import { defineTool } from './Tool.js';
import { toJsonSafe } from './serialize.js';

const thesaurusValueSchema = z.object({
  label: z.string().min(1),
  values: z.array(z.object({ label: z.string().min(1) })).optional(),
});

const thesauriListTool = defineTool({
  name: 'thesauri_list',
  domain: 'thesauri',
  sideEffect: 'read',
  description: 'List thesauri (dictionaries) and their values.',
  parameters: z.object({
    _id: z.string().optional(),
  }),
  execute: async args => {
    const rows = await ThesauriDAOFactory.default().get(args._id ? [args._id] : undefined);
    return toJsonSafe({ rows });
  },
});

const thesauriCreateTool = defineTool({
  name: 'thesauri_create',
  domain: 'thesauri',
  sideEffect: 'write',
  adminOnly: true,
  description: 'Create a thesaurus. Admin only.',
  parameters: z.object({
    name: z.string().min(1),
    values: z.array(thesaurusValueSchema).optional(),
  }),
  execute: async args => {
    const thesaurus = await CreateThesaurusUseCaseFactory.default().execute(args);
    return toJsonSafe({ id: thesaurus.id, name: thesaurus.name, values: thesaurus.values });
  },
});

const thesauriUpdateTool = defineTool({
  name: 'thesauri_update',
  domain: 'thesauri',
  sideEffect: 'write',
  adminOnly: true,
  description: 'Replace a thesaurus name and values. Admin only. Send the full values list.',
  parameters: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    values: z.array(thesaurusValueSchema),
  }),
  execute: async args => {
    const thesaurus = await UpdateThesaurusUseCaseFactory.default().execute(args);
    return toJsonSafe({ id: thesaurus.id, name: thesaurus.name, values: thesaurus.values });
  },
});

const thesauriDeleteTool = defineTool({
  name: 'thesauri_delete',
  domain: 'thesauri',
  sideEffect: 'write',
  adminOnly: true,
  description: 'Delete a thesaurus. Admin only. Fails if templates still use it.',
  parameters: z.object({
    thesaurusId: z.string().min(1),
  }),
  execute: async args => {
    await DeleteThesaurusUseCaseFactory.default().execute(args);
    return { deleted: true, thesaurusId: args.thesaurusId };
  },
});

export { thesauriCreateTool, thesauriDeleteTool, thesauriListTool, thesauriUpdateTool };
