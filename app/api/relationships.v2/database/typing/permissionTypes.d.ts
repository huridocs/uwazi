/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdType } from 'api/relationships.v2/database/typing/commonTypes';

export interface EntityPermissionsDBOType {
  _id?: ObjectIdType;
  sharedId: string;
  permissions: PermissionType[];
}

export type PermissionType = RestrictedPermissionType | PublicPermissionType;

export interface PublicPermissionType {
  refId: 'public';
  type: 'public';
  level: 'public';
}

export interface RestrictedPermissionType {
  refId: ObjectIdType;
  type: 'user' | 'group';
  level: 'read' | 'write';
}
