import { z } from 'zod';
import type { PropertyAssignmentInput } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorService.js';
import { BulkDeleteEntityUseCaseFactory } from '#api/core/infrastructure/factories/BulkDeleteEntityUseCaseFactory.js';
import { CreateEntityUseCaseFactory } from '#api/core/infrastructure/factories/CreateEntityUseCaseFactory.js';
import { EntitiesQueryServiceFactory } from '#api/core/infrastructure/factories/EntitiesQueryServiceFactory.js';
import { UpdateEntityUseCaseFactory } from '#api/core/infrastructure/factories/UpdateEntityUseCaseFactory.js';
import { defineTool } from './Tool.js';
import { toJsonSafe } from './serialize.js';

const toPropertyAssignments = (
  title: string,
  metadata?: Record<string, Array<{ value?: unknown; label?: string }>>
): PropertyAssignmentInput[] => [
  { name: 'title', value: [{ value: title }] },
  ...Object.entries(metadata ?? {}).map(([name, value]) => ({
    name,
    value: value as PropertyAssignmentInput['value'],
  })),
];

const metadataValueSchema = z.object({
  value: z.unknown(),
  label: z.string().optional(),
});

const entitiesGetTool = defineTool({
  name: 'entities_get',
  domain: 'entities',
  sideEffect: 'read',
  description: 'Get one entity by sharedId, including files. Honours the current user permissions.',
  parameters: z.object({
    sharedId: z.string().min(1),
    includeRelationships: z.boolean().optional(),
    includePermissions: z.boolean().optional(),
  }),
  execute: async (args, ctx) => {
    const queryService = EntitiesQueryServiceFactory.default(ctx.actor);
    const entity = await queryService.getEntity({
      sharedId: args.sharedId,
      language: ctx.language,
      includeRelationships: args.includeRelationships ?? false,
      includePermissions: args.includePermissions ?? false,
      user: ctx.actor,
    });
    return toJsonSafe(entity);
  },
});

const entitiesCreateTool = defineTool({
  name: 'entities_create',
  domain: 'entities',
  sideEffect: 'write',
  description: 'Create an entity. Title is required. Metadata keys are template property names.',
  parameters: z.object({
    title: z.string().min(1),
    template: z.string().optional(),
    metadata: z.record(z.array(metadataValueSchema)).optional(),
  }),
  execute: async (args, ctx) => {
    const useCase = CreateEntityUseCaseFactory.default({ targetLanguage: ctx.language });
    const entity = await useCase.execute({
      templateId: args.template,
      propertyAssignments: toPropertyAssignments(args.title, args.metadata),
    });
    return toJsonSafe({ sharedId: entity.sharedId, templateId: entity.asDTO.templateId });
  },
});

const entitiesUpdateTool = defineTool({
  name: 'entities_update',
  domain: 'entities',
  sideEffect: 'write',
  description: 'Update an entity identified by sharedId in the current language.',
  parameters: z.object({
    sharedId: z.string().min(1),
    title: z.string().min(1),
    template: z.string().optional(),
    metadata: z.record(z.array(metadataValueSchema)).optional(),
  }),
  execute: async (args, ctx) => {
    const useCase = UpdateEntityUseCaseFactory.default();
    const entity = await useCase.execute({
      sharedId: args.sharedId,
      language: ctx.language,
      templateId: args.template,
      propertyAssignments: toPropertyAssignments(args.title, args.metadata),
    });
    return toJsonSafe({ sharedId: entity.sharedId, templateId: entity.asDTO.templateId });
  },
});

const entitiesDeleteTool = defineTool({
  name: 'entities_delete',
  domain: 'entities',
  sideEffect: 'write',
  description: 'Delete an entity by sharedId. The current user must be allowed to delete it.',
  parameters: z.object({
    sharedId: z.string().min(1),
  }),
  execute: async args => {
    const useCase = BulkDeleteEntityUseCaseFactory.default();
    return toJsonSafe(await useCase.execute({ sharedIds: [args.sharedId] }));
  },
});

export { entitiesCreateTool, entitiesDeleteTool, entitiesGetTool, entitiesUpdateTool };
