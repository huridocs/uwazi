/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/types/commonTypes';

export interface PageSchema {
  _id?: ObjectIdSchema;
  title: string;
  language?: string;
  sharedId?: string;
  creationDate?: number;
  metadata?: {
    _id?: ObjectIdSchema;
    script?: string;
  };
  user?: ObjectIdSchema;
  entityView?: boolean;
  __v?: number;
}
