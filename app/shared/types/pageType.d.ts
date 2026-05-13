/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from '#shared/types/commonTypes.js';

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
    css?: string;
  };
  user?: ObjectIdSchema;
  entityView?: boolean;
  version?: number;
  __v?: number;
}
