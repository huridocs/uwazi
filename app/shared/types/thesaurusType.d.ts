/**
 * @format
 */

/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/types/commonTypes';

export interface ThesaurusSchema {
  _id?: ObjectIdSchema;
  type?: 'thesauri';
  name: string;
  enable_classification?: boolean; // eslint-disable-line camelcase
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
