import { objectIdSchema } from 'shared/types/commonSchemas';

export const emitSchemaTypes = true;

export const userGroupSchema = {
  $schema: 'http://json-schema.org/schema#',
  type: 'object',
  additionalProperties: false,
  properties: {
    _id: objectIdSchema,
    name: { type: 'string' },
    members: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          _id: objectIdSchema,
          username: { type: 'string' },
        },
        required: ['_id'],
      },
    },
  },
  required: ['name', 'members'],
};
