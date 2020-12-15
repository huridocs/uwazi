import { objectIdSchema } from 'shared/types/commonSchemas';

export const emitSchemaTypes = true;

export enum AccessLevels {
  READ = 'read',
  WRITE = 'write',
  MIXED = 'mixed',
}

export enum PermissionType {
  USER = 'user',
  GROUP = 'group',
}

export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  COLLABORATOR = 'collaborator',
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
