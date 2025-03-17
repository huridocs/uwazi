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
    source: { oneOf: [{ const: '__default_pdf' }, { type: 'string' }] },
    property: { type: 'string' },
    templates: { type: 'array', items: objectIdSchema },
  },
  required: ['_id', 'name', 'source', 'property', 'templates'],
};
