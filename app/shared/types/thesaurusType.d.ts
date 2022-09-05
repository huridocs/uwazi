/* eslint-disable */
/**AUTO-GENERATED. RUN yarn emit-types to update.*/

import { ObjectIdSchema } from 'shared/types/commonTypes';

export interface ThesaurusSchema {
  _id?: ObjectIdSchema;
  type?: 'thesauri' | 'template';
  name: string;
  enable_classification?: boolean;
  values?: ThesaurusValueSchema[];
  [k: string]: unknown | undefined;
}

export interface ThesaurusValueSchema {
  _id?: ObjectIdSchema;
  id?: string;
  label: string;
  values?: {
    _id?: ObjectIdSchema;
    id?: string;
    label: string;
    name?: string;
  }[];
}
