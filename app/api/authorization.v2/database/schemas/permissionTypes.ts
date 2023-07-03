import { ObjectId } from 'mongodb';

export interface EntityPermissionsDBOType {
  _id?: ObjectId;
  sharedId: string;
  permissions: PermissionType[];
}

export type LegacyObjectIdSchema = string | ObjectId;

export type PermissionType = RestrictedPermissionType | PublicPermissionType;

export interface PublicPermissionType {
  refId: 'public';
  type: 'public';
  level: 'public';
}

export interface RestrictedPermissionType {
  refId: string | ObjectId;
  type: 'user' | 'group';
  level: 'read' | 'write';
}
