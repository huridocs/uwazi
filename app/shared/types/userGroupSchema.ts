import { objectIdSchema } from 'shared/types/commonSchemas';

export const emitSchemaTypes = true;

export const groupMemberSchema = {
  type: 'object',
  additionalProperties: false,
  definitions: { objectIdSchema },
  properties: {
    refId: objectIdSchema,
  },
  required: ['refId'],
};
export const userGroupSchema = {
  $schema: 'http://json-schema.org/schema#',
  $async: true,
  type: 'object',
  additionalProperties: false,
  uniqueName: true,
  definitions: { objectIdSchema, groupMemberSchema },
  properties: {
    _id: objectIdSchema,
    name: { type: 'string' },
    members: {
      type: 'array',
      items: groupMemberSchema,
    },
    __v: { type: 'number' },
  },
  required: ['name', 'members'],
};
