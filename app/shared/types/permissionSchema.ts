import Ajv from 'ajv';
import { objectIdSchema } from 'shared/types/commonSchemas';
import { unique } from 'api/utils/filters';
import { wrapValidator } from 'shared/tsUtils';
import { PermissionsDataSchema } from 'shared/types/permissionType';

const ajv = Ajv({ allErrors: true });

export const emitSchemaTypes = true;

export enum AccessLevels {
  READ = 'read',
  WRITE = 'write',
}

export enum MixedAccess {
  MIXED = 'mixed',
}

export type MixedAccessLevels = AccessLevels | MixedAccess;

export enum PermissionType {
  USER = 'user',
  GROUP = 'group',
}

export const permissionType = { type: 'string', enum: Object.values(PermissionType) };
export const permissionLevel = { type: 'string', enum: Object.values(AccessLevels) };

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

ajv.addKeyword('uniqueIds', {
  type: 'object',
  errors: true,
  validate: (fields: any, data: PermissionsDataSchema) => {
    const allowedIds = data.permissions.map(item => item._id);
    const uniqueIds = allowedIds.filter(unique);
    if (allowedIds.length !== uniqueIds.length) {
      throw new Ajv.ValidationError([
        {
          keyword: 'duplicatedPermissions',
          schemaPath: '',
          params: { keyword: 'duplicatedPermissions', fields },
          message: 'Permissions should be unique by person/group',
          dataPath: '.permissions',
        },
      ]);
    }
    return true;
  },
});

export const permissionsDataSchema = {
  type: 'object',
  additionalProperties: false,
  definitions: { objectIdSchema },
  properties: {
    ids: { type: 'array', items: { type: 'string' } },
    permissions: {
      type: 'array',
      items: { ...permissionSchema },
      range: true,
    },
  },
  required: ['ids', 'permissions'],
};

export const validateUniquePermissions = wrapValidator(ajv.compile({ uniqueIds: true }));
