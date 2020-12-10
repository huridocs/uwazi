import { objectIdSchema } from 'shared/types/commonSchemas';

export const emitSchemaTypes = true;

const permissionType = { type: 'string', enum: ['user', 'group'] };
const permissionRole = { type: 'string', enum: ['contributor', 'editor', 'admin'] };
const permissionLevel = { type: 'string', enum: ['read', 'write', 'mixed'] };

export const permissionSchema = {
  type: 'object',
  additionalProperties: false,
  definitions: { objectIdSchema },
  properties: {
    _id: objectIdSchema,
    type: permissionType,
    level: permissionLevel,
  },
  required: ['_id', 'type', 'level'],
};

export const permissionsSchema = {
  type: 'array',
  definitions: { objectIdSchema, permissionSchema },
  items: permissionSchema,
};

export const grantedPermissionSchema = {
  type: 'object',
  additionalProperties: false,
  definitions: { objectIdSchema },
  properties: {
    _id: objectIdSchema,
    type: permissionType,
    level: permissionLevel,
    label: { type: 'string' },
    role: permissionRole,
  },
  required: ['_id', 'type', 'level', 'label'],
};
