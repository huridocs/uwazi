import { z } from 'zod';
import { PropertyTypeEnum } from '../domain/template/PropertyType';

const BasePropertySchema = z.object({
  label: z.string(),
  type: z.nativeEnum(PropertyTypeEnum),
  prioritySorting: z.boolean().optional(),
  generatedId: z.boolean().optional(),
  content: z.string().optional().nullable(),
  relationType: z.string().optional(),
  inherit: z
    .object({
      property: z.string(),
      type: z.nativeEnum(PropertyTypeEnum),
    })
    .optional()
    .or(z.literal(''))
    .nullable(),

  filter: z.boolean().optional(),
  defaultfilter: z.boolean().optional(),
  noLabel: z.boolean().optional(),
  fullWidth: z.boolean().optional(),
  style: z.string().optional(),
  required: z.boolean().optional(),
  sortable: z.boolean().optional(),
  showInCard: z.boolean().optional(),
  nestedProperties: z.array(z.string()).optional(),
  query: z.unknown().optional(),
  denormalizedProperty: z.string().optional(),
  targetTemplates: z.union([z.literal(false), z.array(z.string())]).optional(),
});

const BaseCommonPropertySchema = z.object({
  label: z.string(),
  type: z.nativeEnum(PropertyTypeEnum),
  name: z.string(),
  isCommonProperty: z.literal(true).optional(),

  prioritySorting: z.boolean().optional(),
  generatedId: z.boolean().optional(),
});

const BaseTemplateSchema = z.object({
  name: z.string({ message: 'Template name is required' }),
  color: z.string().optional(),
  entityViewPage: z.string().optional(),
  commonProperties: z.array(BaseCommonPropertySchema),
  properties: z.array(BasePropertySchema).default([]),
});

const UpdatePropertySchema = BasePropertySchema.extend({
  id: z.string().optional(),
});

const UpdateCommonPropertySchema = BaseCommonPropertySchema.extend({
  id: z.string({ message: 'Common property id is required' }),
});

const UpdateTemplateSchema = BaseTemplateSchema.extend({
  id: z.string({ message: 'Template id is required' }),
  commonProperties: z.array(UpdateCommonPropertySchema),
  properties: z.array(UpdatePropertySchema).default([]),
});

export {
  BaseTemplateSchema as CreateTemplateDTOSchema,
  UpdateTemplateSchema as UpdateTemplateDTOSchema,
};

export type CreateTemplateDTO = z.infer<typeof BaseTemplateSchema>;
export type UpdateTemplateDTO = z.infer<typeof UpdateTemplateSchema>;
