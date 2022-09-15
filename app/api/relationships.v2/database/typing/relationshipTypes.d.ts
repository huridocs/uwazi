/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdType } from 'api/relationships.v2/database/typing/commonTypes';

export interface JoinedRelationshipDBOType {
  _id: ObjectIdType;
  from: EntityInfoArrayType;
  to: EntityInfoArrayType;
  type: ObjectIdType;
}

export interface RelationshipDBOType {
  _id: ObjectIdType;
  from: string;
  to: string;
  type: ObjectIdType;
}

export type EntityInfoArrayType = EntityInfoType[];

export interface EntityInfoType {
  sharedId: string;
  title: string;
  [k: string]: unknown | undefined;
}
