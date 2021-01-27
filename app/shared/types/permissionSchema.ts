import { objectIdSchema } from 'shared/types/commonSchemas';

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

export const permissionsDataSchema = {
  type: 'object',
  additionalProperties: false,
  definitions: { objectIdSchema },
  properties: {
    ids: { type: 'array', items: { type: 'string' } },
    permissions: {
      type: 'array',
      items: permissionSchema,
    },
  },
  required: ['ids', 'permissions'],
};
