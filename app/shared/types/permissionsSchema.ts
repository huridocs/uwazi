import { objectIdSchema } from 'shared/types/commonSchemas';

export const emitSchemaTypes = true;

export const permissionSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    _id: objectIdSchema,
    type: { type: 'string' },
    permission: { type: 'string' },
  },
  required: ['_id', 'type', 'permission'],
};

export const permissionsSchema = {
  type: 'array',
  items: permissionSchema,
};
