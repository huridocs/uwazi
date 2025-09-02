import { UseCase } from 'api/common.v2/contracts/UseCase';
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

const PropertySchema = z.object({
  label: z.string(),
  type: z.enum(types),
  prioritySorting: z.boolean().optional(),
  generatedId: z.boolean().optional(),
  content: z.string().optional(), // Is the target template Id or thesaurus Id.
  relationType: z.string().optional(), // Only for relationship type properties
  inherit: z
    .object({
      property: z.string(),
    })
    .optional(), // Only for relationship type properties

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

const Schema = z.object({
  name: z.string({ message: 'Template name is required' }),
  color: z.string().optional(), // If not provided, domain will generate next on pallet
  entityViewPage: z.string().optional(),
  commonProperties: z.array(PropertySchema).nonempty(),
  properties: z.array(PropertySchema).default([]),
});

type Input = z.infer<typeof Schema>;

type Output = {};

class CreateTemplateUseCase implements UseCase<Input, Output> {
  async execute(input: Input): Promise<Output> {
    throw new Error('Method not implemented.');
  }
}

export { CreateTemplateUseCase, Schema };
export type { Input as CreateTemplateInput, Output as CreateTemplateOutput };
