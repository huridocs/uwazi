/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/types/commonTypes';

export interface TranslationType {
  _id?: ObjectIdSchema;
  locale?: string;
  contexts?: {
    _id?: ObjectIdSchema;
    id?: string;
    label?: string;
    type?: string;
    values?: {
      _id?: ObjectIdSchema;
      key?: string;
      value?: string;
    }[];
  }[];
}
