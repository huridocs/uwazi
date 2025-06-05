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
    source: {
      type: 'object',
      additionalProperties: false,
      properties: {
        pdf: { type: 'boolean' },
        property: { type: 'string' },
      },
    },
    property: { type: 'string' },
    templates: { type: 'array', items: objectIdSchema },
  },
  required: ['_id', 'name', 'source', 'property', 'templates'],
};
