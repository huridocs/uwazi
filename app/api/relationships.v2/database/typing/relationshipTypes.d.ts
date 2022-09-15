/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/types/commonTypes';

export interface JoinedRelationshipDBOSchema {
  _id: ObjectIdSchema;
  from: EntityInfoArraySchema;
  to: EntityInfoArraySchema;
  type: ObjectIdSchema;
}

export interface RelationshipDBOSchema {
  _id: ObjectIdSchema;
  from: string;
  to: string;
  type: ObjectIdSchema;
}

export type EntityInfoArraySchema = EntityInfoSchema[];

export interface EntityInfoSchema {
  sharedId: string;
  title: string;
  [k: string]: unknown | undefined;
}
