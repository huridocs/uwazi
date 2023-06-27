import { objectIdSchema } from 'api/common.v2/database/schemas/commonSchemas';

const emitSchemaTypes = true;

const legacyObjectIdSchema = {
  oneOf: [
    { type: 'string' },
    {
      type: 'object',
      tsType: 'ObjectId',
    },
  ],
};

const restrictedPermissionSchema = {
  type: 'object',
  title: 'RestrictedPermissionType',
  additionalProperties: false,
  properties: {
    refId: legacyObjectIdSchema,
    type: { type: 'string', enum: ['user', 'group'] },
    level: { type: 'string', enum: ['read', 'write'] },
  },
  required: ['refId', 'type', 'level'],
};

const publicPermissionSchema = {
  type: 'object',
  title: 'PublicPermissionType',
  additionalProperties: false,
  properties: {
    refId: { type: 'string', enum: ['public'] },
    type: { type: 'string', enum: ['public'] },
    level: { type: 'string', enum: ['public'] },
  },
  required: ['refId', 'type', 'level'],
};

const permissionSchema = {
  title: 'PermissionType',
  oneOf: [restrictedPermissionSchema, publicPermissionSchema],
};

const entityPermissionsDBOSchema = {
  type: 'object',
  title: 'EntityPermissionsDBOType',
  additionalProperties: false,
  definitions: { objectIdSchema, permissionSchema },
  properties: {
    _id: objectIdSchema,
    sharedId: { type: 'string' },
    permissions: {
      type: 'array',
      items: permissionSchema,
    },
  },
  required: ['sharedId', 'permissions'],
};

export {
  restrictedPermissionSchema,
  publicPermissionSchema,
  permissionSchema,
  entityPermissionsDBOSchema,
  emitSchemaTypes,
  legacyObjectIdSchema,
};
