/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/types/commonTypes';

export interface JoinedRelationshipDBOType {
  _id: ObjectIdSchema;
  from: EntityInfoArrayType;
  to: EntityInfoArrayType;
  type: ObjectIdSchema;
}

export interface RelationshipDBOType {
  _id: ObjectIdSchema;
  from: string;
  to: string;
  type: ObjectIdSchema;
}

export type EntityInfoArrayType = EntityInfoType[];

export interface EntityInfoType {
  sharedId: string;
  title: string;
  [k: string]: unknown | undefined;
}
