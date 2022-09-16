import { objectIdSchema } from 'api/relationships.v2/database/typing/commonSchemas';
import { createDefaultValidator } from 'api/relationships.v2/validation/ajvInstances';

const emitSchemaTypes = true;

const restrictedPermissionSchema = {
  type: 'object',
  title: 'RestrictedPermissionType',
  additionalProperties: false,
  properties: {
    refId: objectIdSchema,
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
const validateEntityPermissionsDBO = createDefaultValidator(entityPermissionsDBOSchema);

export {
  restrictedPermissionSchema,
  publicPermissionSchema,
  permissionSchema,
  entityPermissionsDBOSchema,
  validateEntityPermissionsDBO,
  emitSchemaTypes,
};
