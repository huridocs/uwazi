import { ObjectId } from 'mongodb';

export interface EntityPermissionsDBO {
  _id?: ObjectId;
  sharedId: string;
  published?: boolean;
  permissions: Permission[];
}

export type LegacyObjectIdSchema = string | ObjectId;

export interface Permission {
  refId: LegacyObjectIdSchema;
  type: 'user' | 'group';
  level: 'read' | 'write';
}
