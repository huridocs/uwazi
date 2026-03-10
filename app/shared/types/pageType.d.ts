/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/types/commonTypes';

export interface PageType {
  _id?: ObjectIdSchema;
  title: string;
  language?: string;
  sharedId?: string;
  creationDate?: number;
  metadata?: {
    _id?: ObjectIdSchema;
    content?: string;
    script?: string;
  };
  user?: ObjectIdSchema;
  entityView?: boolean;
  __v?: number;
}
