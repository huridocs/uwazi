/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/commonTypes';

export interface ThesaurusSchema {
  _id?: ObjectIdSchema;
  type?: 'thesauri';
  name: string;
  enable_classification?: boolean;
  values?: {
    _id?: ObjectIdSchema;
    id?: string;
    label: string;
    classificationEnabled?: boolean;
    values?: {
      _id?: ObjectIdSchema;
      id?: string;
      label: string;
    }[];
  }[];
  [k: string]: any | undefined;
}
