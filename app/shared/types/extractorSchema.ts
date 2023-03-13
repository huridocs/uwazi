import { objectIdSchema } from 'shared/types/commonSchemas';

export const emitSchemaTypes = true;

export const IXExtractorSchema = {
  type: 'object',
  additionalProperties: false,
  title: 'IXExtractorType',
  definitions: { objectIdSchema },
  properties: {
    _id: objectIdSchema,
    name: { type: 'string' },
    property: { type: 'string' },
    templates: { type: 'array', items: objectIdSchema },
  },
  required: ['_id', 'name', 'property', 'templates'],
};
