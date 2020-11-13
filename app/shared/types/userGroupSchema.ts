import { objectIdSchema } from 'shared/types/commonSchemas';

export const emitSchemaTypes = true;

export const groupMemberSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    _id: objectIdSchema,
    username: { type: 'string' },
    role: { type: 'string' },
    email: { type: 'string' },
  },
};
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
        ...groupMemberSchema,
        required: ['_id'],
      },
    },
    __v: { type: 'number' },
  },
  required: ['name', 'members'],
};
