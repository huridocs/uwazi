import { z } from 'zod';

const types = [
  'date',
  'daterange',
  'geolocation',
  'image',
  'link',
  'markdown',
  'media',
  'multidate',
  'multidaterange',
  'multiselect',
  'nested',
  'numeric',
  'preview',
  'relationship',
  'select',
  'text',
  'generatedid',
  'newRelationship',
] as const;

const BasePropertySchema = z.object({
  label: z.string(),
  type: z.enum(types),
  prioritySorting: z.boolean().optional(),
  generatedId: z.boolean().optional(),
  content: z.string().optional(), // Is the target template Id or thesaurus Id.
  relationType: z.string().optional(), // Only for relationship type properties
  inherit: z
    .object({
      property: z.string(),
      type: z.enum(types),
    })
    .optional()
    .or(z.literal(''))
    .nullable(), // Only for relationship type propertie

  filter: z.boolean().optional(), // Depends on the type of Property
  defaultFilter: z.boolean().optional(), // Depends on the type of Property
  noLabel: z.boolean().optional(),
  fullWidth: z.boolean().optional(), // Only used when type is multiMedia
  style: z.string().optional(), // Related to multiMedia, create a enum for the correct values
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
  type: z.enum(types),
  name: z.string(),
  isCommonProperty: z.literal(true).default(true),

  prioritySorting: z.boolean().optional(),
  generatedId: z.boolean().optional(),
});

const BaseTemplateSchema = z.object({
  name: z.string({ message: 'Template name is required' }),
  color: z.string().optional(), // If not provided, domain will generate next on pallet
  default: z.boolean().optional(),
  entityViewPage: z.string().optional(),
  commonProperties: z.array(BaseCommonPropertySchema),
  properties: z.array(BasePropertySchema).default([]),
});

const UpdatePropertySchema = BasePropertySchema.extend({
  _id: z.string().optional(),
});

const UpdateCommonPropertySchema = BaseCommonPropertySchema.extend({
  _id: z.string({ message: 'Template _id is required' }),
});

const UpdateTemplateSchema = BaseTemplateSchema.extend({
  _id: z.string({ message: 'Template _id is required' }),
  commonProperties: z.array(UpdateCommonPropertySchema),
  properties: z.array(UpdatePropertySchema).default([]),
});

export {
  BaseTemplateSchema as CreateTemplateDTOSchema,
  UpdateTemplateSchema as UpdateTemplateDTOSchema,
};

export type CreateTemplateDTO = z.infer<typeof BaseTemplateSchema>;
export type UpdateTemplateDTO = z.infer<typeof UpdateTemplateSchema>;
