import { z } from 'zod';
import { CreateTemplateDTOSchema } from '#api/core/application/TemplateDTOs.js';
import { TemplateFacade } from '#api/core/infrastructure/facades/TemplateFacade.js';
import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';
import { defineTool } from './Tool.js';
import { toJsonSafe } from './serialize.js';

const templatePropertySchema = z.record(z.unknown());

const templatesListTool = defineTool({
  name: 'templates_list',
  domain: 'templates',
  sideEffect: 'read',
  description: 'List all templates (entity types) with their properties.',
  parameters: z.object({}),
  execute: async () => {
    const templates = await TemplatesDAOFactory.default().get();
    return toJsonSafe({
      rows: templates.map(template => ({ ...template, _id: template._id.toString() })),
    });
  },
});

const templatesCreateTool = defineTool({
  name: 'templates_create',
  domain: 'templates',
  sideEffect: 'write',
  adminOnly: true,
  description: 'Create a template. Admin only. Title/date common properties are added if omitted.',
  parameters: z.object({
    name: z.string().min(1),
    color: z.string().optional(),
    entityViewPage: z.string().optional(),
    properties: z.array(templatePropertySchema).optional(),
    commonProperties: z.array(templatePropertySchema).optional(),
  }),
  execute: async args => {
    if (!args.commonProperties) {
      return toJsonSafe(
        await TemplateFacade.createWithDefaultValues({
          name: args.name,
          color: args.color,
          entityViewPage: args.entityViewPage,
          properties: args.properties as never,
        })
      );
    }
    return toJsonSafe(await TemplateFacade.create(CreateTemplateDTOSchema.parse(args)));
  },
});

const templatesUpdateTool = defineTool({
  name: 'templates_update',
  domain: 'templates',
  sideEffect: 'write',
  adminOnly: true,
  description: 'Update a template by id. Admin only. Send the full template including properties.',
  parameters: z.object({
    _id: z.string().min(1),
    name: z.string().min(1),
    color: z.string().optional(),
    entityViewPage: z.string().optional(),
    commonProperties: z.array(z.record(z.unknown())),
    properties: z.array(z.record(z.unknown())).optional(),
    reindex: z.boolean().optional(),
  }),
  execute: async (args, ctx) =>
    toJsonSafe(
      await TemplateFacade.update(
        {
          ...args,
          reindex: args.reindex ?? false,
        } as unknown as Parameters<typeof TemplateFacade.update>[0],
        ctx.language
      )
    ),
});

const templatesDeleteTool = defineTool({
  name: 'templates_delete',
  domain: 'templates',
  sideEffect: 'write',
  adminOnly: true,
  description: 'Delete a template by id. Admin only. Fails if entities still use it.',
  parameters: z.object({
    _id: z.string().min(1),
  }),
  execute: async args => toJsonSafe(await TemplateFacade.delete({ _id: args._id })),
});

export { templatesCreateTool, templatesDeleteTool, templatesListTool, templatesUpdateTool };
