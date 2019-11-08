/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emitTypes to update.*/

import { ObjectIdSchema } from 'shared/commonTypes';

export interface ThesaurusSchema {
  _id?: ObjectIdSchema;
  type?: 'thesauri';
  name: string;
  values?: {
    _id?: ObjectIdSchema;
    id?: string;
    label: string;
    values?: {
      _id?: ObjectIdSchema;
      id?: string;
      label: string;
    }[];
  }[];
  [k: string]: any | undefined;
}
