import { objectIdSchema } from 'shared/types/commonSchemas';

export const emitSchemaTypes = true;

export const PageSchema = {
  $schema: 'http://json-schema.org/schema#',
  $async: true,
  type: 'object',
  additionalProperties: false,
  title: 'PageSchema',
  definitions: { objectIdSchema },
  properties: {
    _id: objectIdSchema,
    title: { type: 'string' },
    language: { type: 'string' },
    sharedId: { type: 'string' },
    creationDate: { type: 'number' },
    metadata: {
      type: 'object',
      additionalProperties: false,
      definitions: { objectIdSchema },
      properties: {
        _id: objectIdSchema,
        content: { type: 'string' },
        script: { type: 'string' },
      },
    },
    user: objectIdSchema,
    entityView: { type: 'boolean' },
    __v: { type: 'number' },
  },
  required: ['title'],
};
