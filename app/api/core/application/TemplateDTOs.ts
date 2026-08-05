import { z } from 'zod';
import { PropertyTypeEnum } from '../domain/template/PropertyType.js';

const CorePropertyTypeSchema = z.union([
  z.literal(PropertyTypeEnum.Date),
  z.literal(PropertyTypeEnum.DateRange),
  z.literal(PropertyTypeEnum.Geolocation),
  z.literal(PropertyTypeEnum.Image),
  z.literal(PropertyTypeEnum.Link),
  z.literal(PropertyTypeEnum.Markdown),
  z.literal(PropertyTypeEnum.Media),
  z.literal(PropertyTypeEnum.MultiDate),
  z.literal(PropertyTypeEnum.MultiDateRange),
  z.literal(PropertyTypeEnum.MultiSelect),
  z.literal(PropertyTypeEnum.Nested),
  z.literal(PropertyTypeEnum.Numeric),
  z.literal(PropertyTypeEnum.Preview),
  z.literal(PropertyTypeEnum.Relationship),
  z.literal(PropertyTypeEnum.Select),
  z.literal(PropertyTypeEnum.Text),
  z.literal(PropertyTypeEnum.GeneratedId),
]);

const BasePropertySchema = z.object({
  label: z.string(),
  type: CorePropertyTypeSchema,
  prioritySorting: z.boolean().optional(),
  generatedId: z.boolean().optional(),
  content: z.string().optional().nullable(),
  relationType: z.string().optional(),
  inherit: z
    .object({
      property: z.string(),
      type: CorePropertyTypeSchema,
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
  type: CorePropertyTypeSchema,
  name: z.string(),
  isCommonProperty: z.literal(true).optional(),

  prioritySorting: z.boolean().optional(),
  generatedId: z.boolean().optional(),
});

const BaseTemplateSchema = z
  .object({
    name: z.string({ message: 'Template name is required' }),
    color: z.string().optional(),
    entityViewPage: z.string().optional(),
    commonProperties: z.array(BaseCommonPropertySchema),
    properties: z.array(BasePropertySchema).default([]),
  })
  .strict();

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
}).strict();

export {
  BaseTemplateSchema as CreateTemplateDTOSchema,
  UpdateTemplateSchema as UpdateTemplateDTOSchema,
};

export type CreateTemplateDTO = z.infer<typeof BaseTemplateSchema>;
export type UpdateTemplateDTO = z.infer<typeof UpdateTemplateSchema>;
