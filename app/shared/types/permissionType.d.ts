/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

export interface PermissionSchema {
  refId: ObjectIdSchema;
  type: 'user' | 'group' | 'public';
  level: 'read' | 'write' | 'mixed';
}

export interface PermissionsDataSchema {
  ids: string[];
  permissions: {
    refId: ObjectIdSchema;
    type: 'user' | 'group' | 'public';
    level: 'read' | 'write' | 'mixed';
  }[];
}
