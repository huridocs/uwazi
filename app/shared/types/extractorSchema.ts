import { objectIdSchema } from 'shared/types/commonSchemas';

export const emitSchemaTypes = true;

export const IXExtractorSchema = {
  type: 'object',
  additionalProperties: false,
  title: 'IXExtractorType',
  definitions: { objectIdSchema },
  properties: {
    _id: objectIdSchema,
    extractorId: { type: 'string' },
    name: { type: 'string' },
    property: { type: 'string' },
    templates: { type: 'array', items: objectIdSchema },
  },
  required: ['extractorId', 'name', 'property', 'templates'],
};
