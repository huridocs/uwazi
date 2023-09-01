import { ObjectId } from 'mongodb';

export interface EntityPermissionsDBOType {
  _id?: ObjectId;
  sharedId: string;
  published?: boolean;
  permissions: PermissionType[];
}

export type LegacyObjectIdSchema = string | ObjectId;

export interface PermissionType {
  refId: LegacyObjectIdSchema;
  type: 'user' | 'group';
  level: 'read' | 'write';
}
