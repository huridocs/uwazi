import { ObjectId } from 'mongodb';

interface EntityPermission {
  refId?: string | ObjectId;
  type?: 'user' | 'group' | 'public';
  level?: 'read' | 'write' | 'mixed';
}

interface Entity {
  _id: ObjectId;
  sharedId: string;
  language: string;
  title?: string;
  permissions?: EntityPermission[];
  [k: string]: unknown | undefined;
}

export type { Entity };
